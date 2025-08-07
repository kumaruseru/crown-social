// Chờ DOM được tải hoàn toàn trước khi chạy script
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DOM loaded, checking Leaflet...');
    console.log('🔍 Leaflet available:', typeof L !== 'undefined');
    
    // Đợi navigation manager khởi tạo xong rồi mới init map
    setTimeout(() => {
        initializeMap();
    }, 400); // Tăng delay để navigation.js hoàn toàn setup xong
});

/**
 * Khởi tạo bản đồ Leaflet, thêm các lớp và marker.
 */
function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('❌ Không tìm thấy phần tử div với id="map".');
        return;
    }
    
    console.log('🔍 Map container found:', mapContainer);

    // Kiểm tra xem bản đồ đã được khởi tạo chưa để tránh lỗi
    if (mapContainer._leaflet_id) {
        console.log('⚠️ Map đã được khởi tạo rồi, bỏ qua');
        return;
    }

    try {
        if (typeof L === 'undefined') {
            throw new Error('Thư viện Leaflet.js chưa được tải.');
        }
        
        console.log('🗺️ Creating Leaflet map...');

        // 1. Khởi tạo đối tượng bản đồ
        const map = L.map('map', {
            zoomControl: false, // Tắt nút zoom
            attributionControl: false, // Tắt attribution mặc định để thêm sau
        }).setView([10.7769, 106.7009], 13); // Tọa độ TP.HCM
        
        console.log('✅ Map object created');

        // 2. *** SỬA LỖI QUAN TRỌNG ***
        // Buộc Leaflet tính toán lại kích thước của nó.
        // Điều này khắc phục sự cố bản đồ không hiển thị đầy đủ.
        map.invalidateSize();
        console.log('✅ Map size invalidated');

        // 3. Thêm lớp Tile Layer (nền bản đồ)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        console.log('✅ Tile layer added');

        // 3.5. Thêm chức năng định vị người dùng
        addUserLocation(map);

        // 4. Thêm các Marker tùy chỉnh
        addCustomMarkers(map);
        console.log('✅ Custom markers added');

        // 5. Cập nhật theme cho bản đồ dựa trên cài đặt của trang
        updateMapTheme();
        document.addEventListener('themeChanged', updateMapTheme);
        
        // Force resize after everything loads (similar to debug version)
        setTimeout(() => {
            map.invalidateSize();
            console.log('✅ Final map resize completed');
        }, 100);

        console.log('✅ Bản đồ đã được khởi tạo thành công.');

    } catch (error) {
        console.error('❌ Đã xảy ra lỗi khi khởi tạo bản đồ:', error);
    }
}

/**
 * Thêm chức năng định vị người dùng.
 * @param {L.Map} map - Đối tượng bản đồ Leaflet.
 */
function addUserLocation(map) {
    if ('geolocation' in navigator) {
        console.log('🌍 Requesting user location...');
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                console.log(`✅ User location found: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
                
                // Tạo icon người dùng
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: `<div class="user-location-icon">
                               <div class="user-dot"></div>
                               <div class="user-pulse"></div>
                           </div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                // Thêm marker vị trí người dùng
                const userMarker = L.marker([lat, lng], { icon: userIcon })
                    .addTo(map)
                    .bindPopup(`<b>Vị trí của bạn</b><br>Độ chính xác: ~${Math.round(accuracy)}m`);
                
                // Di chuyển map đến vị trí người dùng
                map.setView([lat, lng], 15);
                
                console.log('✅ User location marker added');
            },
            function(error) {
                console.warn('⚠️ Không thể lấy vị trí người dùng:', error.message);
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        console.log('User denied location permission');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log('Location information unavailable');
                        break;
                    case error.TIMEOUT:
                        console.log('Location request timed out');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    } else {
        console.warn('⚠️ Geolocation is not supported by this browser');
    }
}

/**
 * Thêm các marker tùy chỉnh vào bản đồ.
 * @param {L.Map} map - Đối tượng bản đồ Leaflet.
 */
function addCustomMarkers(map) {
    // Marker cho "An Nguyễn"
    const avatarIconA = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div class="avatar-marker-container">
                   <img src="https://placehold.co/48x48/93C5FD/1E3A8A?text=A" alt="Avatar A" class="w-12 h-12 rounded-full border-4 border-slate-800 shadow-lg">
               </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48] // Neo vào điểm dưới cùng của marker
    });
    L.marker([10.785, 106.702], { icon: avatarIconA }).addTo(map).bindPopup("<b>An Nguyễn</b><br>Đang ở gần đây.");

    // Marker cho "Bình Trần"
    const avatarIconB = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div class="avatar-marker-container">
                   <img src="https://placehold.co/48x48/A7F3D0/059669?text=B" alt="Avatar B" class="w-12 h-12 rounded-full border-4 border-slate-800 shadow-lg">
                </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48]
    });
    L.marker([10.77, 106.695], { icon: avatarIconB }).addTo(map).bindPopup("<b>Bình Trần</b><br>Đang ở Quận 1.");

    // Marker chấm đơn giản
    const dotIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div class="simple-dot-marker"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    L.marker([10.778, 106.715], { icon: dotIcon }).addTo(map).bindPopup("Một địa điểm thú vị.");
}

/**
 * Cập nhật theme (sáng/tối) cho lớp bản đồ.
 */
function updateMapTheme() {
    const mapContainer = document.getElementById('map');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (mapContainer) {
        mapContainer.setAttribute('data-theme', currentTheme);
        console.log(`🎨 Theme bản đồ được cập nhật: ${currentTheme}`);
    }
}
