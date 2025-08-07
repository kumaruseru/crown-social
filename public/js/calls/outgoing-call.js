/**
 * Outgoing Call JavaScript
 * Xử lý logic cho trang cuộc gọi đi
 */

lucide.createIcons();

// Initialize audio manager for outgoing call
const audioManager = new CallAudioManager();

// Start playing outgoing call ringtone immediately
console.log('🔊 Starting outgoing call ringtone...');
audioManager.playRinging(true);

// Lấy dữ liệu từ URL parameters
const urlParams = new URLSearchParams(window.location.search);
const urlCallType = urlParams.get('type');
const urlContactName = urlParams.get('contact');

// Lấy dữ liệu cuộc gọi từ sessionStorage
let callData = {};
try {
    const callDataString = sessionStorage.getItem('currentCallData');
    if (callDataString) {
        callData = JSON.parse(callDataString);
    }
} catch (error) {
    console.error('Error loading call data:', error);
}

// Ưu tiên URL parameters, fallback về sessionStorage, sau đó fallback data
const callType = urlCallType || callData.callType || 'voice';
const contactId = callData.contactId || 'unknown';
const contactName = urlContactName || callData.contactName || 'Người dùng';
const contactAvatar = callData.contactAvatar || '';
const callerName = callData.callerName || 'Bạn';
const callerAvatar = callData.callerAvatar || '';
const isVideoCall = callType === 'video';

// Biến trạng thái
let callStartTime = null;
let callTimeout = null;
let statusUpdateInterval = null;

// Lấy elements
const endCallBtn = document.getElementById('end-call');
const callStatus = document.getElementById('call-status');
const calleeNameElement = document.getElementById('callee-name');
const calleeAvatarElement = document.getElementById('callee-avatar');
const backgroundElement = document.querySelector('.background-blur');

// Cập nhật UI với dữ liệu thật
function updateUIWithRealData() {
    if (calleeNameElement) {
        calleeNameElement.textContent = contactName;
    }
    
    if (calleeAvatarElement) {
        if (contactAvatar) {
            calleeAvatarElement.src = contactAvatar;
            calleeAvatarElement.alt = contactName;
        } else {
            // Fallback avatar với chữ cái đầu
            const firstLetter = contactName.charAt(0).toUpperCase();
            calleeAvatarElement.src = `https://placehold.co/160x160/6B7280/FFFFFF?text=${firstLetter}`;
            calleeAvatarElement.alt = contactName;
        }
    }
    
    if (backgroundElement) {
        if (contactAvatar) {
            backgroundElement.style.backgroundImage = `url('${contactAvatar}')`;
        } else {
            // Fallback background
            const firstLetter = contactName.charAt(0).toUpperCase();
            backgroundElement.style.backgroundImage = `url('https://placehold.co/600x800/6B7280/FFFFFF?text=${firstLetter}')`;
        }
    }
}

// Bắt đầu cuộc gọi đi
function startOutgoingCall() {
    callStartTime = new Date();
    
    // Cập nhật UI với dữ liệu thật
    updateUIWithRealData();
    
    // Cập nhật UI dựa trên loại cuộc gọi và người dùng thật
    if (isVideoCall) {
        callStatus.textContent = `Đang gọi video ${contactName}`;
        callStatus.className = 'text-lg text-yellow-400 mt-2 status-connecting loading-dots';
        document.title = `Đang gọi video ${contactName}...`;
    } else {
        callStatus.textContent = `Đang gọi ${contactName}`;
        callStatus.className = 'text-lg text-yellow-400 mt-2 status-connecting loading-dots';
        document.title = `Đang gọi ${contactName}...`;
    }
    
    // Giả lập trạng thái kết nối
    setTimeout(() => {
        if (callTimeout) { // Kiểm tra nếu cuộc gọi chưa bị hủy
            if (isVideoCall) {
                callStatus.textContent = `Đang đổ chuông video tới ${contactName}`;
                callStatus.className = 'text-lg text-blue-500 mt-2 status-ringing loading-dots';
            } else {
                callStatus.textContent = `Đang đổ chuông tới ${contactName}`;
                callStatus.className = 'text-lg text-blue-500 mt-2 status-ringing loading-dots';
            }
        }
    }, 1500);
    
    // Giả lập timeout sau 60 giây (tăng thời gian để đảm bảo kết nối)
    callTimeout = setTimeout(() => {
        // Stop outgoing ringtone on timeout
        console.log('🔇 Stopping outgoing ringtone - call timeout...');
        audioManager.stopAllSounds();
        
        callStatus.textContent = `${contactName} không trả lời`;
        callStatus.className = 'text-lg text-red-500 mt-2 status-no-answer';
        
        // Tự động kết thúc sau 2 giây
        setTimeout(() => {
            endCall();
        }, 2000);
    }, 60000);
    
    // Giả lập người nhận máy sau 3-6 giây (luôn thành công)
    const connectionDelay = Math.random() * 3000 + 3000; // 3-6 giây random
    setTimeout(() => {
        if (callTimeout) { // Kiểm tra nếu cuộc gọi chưa bị hủy
            clearTimeout(callTimeout);
            switchToActiveCall();
        }
    }, connectionDelay);
}

// Chuyển sang trang active call trong cùng cửa sổ
function switchToActiveCall() {
    console.log(`Cuộc gọi ${callType} tới ${contactName} đã được kết nối`);
    
    // Stop outgoing ringtone immediately
    console.log('🔇 Stopping outgoing ringtone - call answered...');
    audioManager.stopAllSounds();
    
    // Dừng timeout
    if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
    }
    
    // Cập nhật UI
    callStatus.textContent = `${contactName} đã nhận máy - Đang kết nối...`;
    callStatus.className = 'text-lg text-green-400 mt-2';
    
    // Store active call data for active-call.html
    const activeCallData = {
        callType: callType,
        contactId: contactId,
        contactName: contactName,
        contactAvatar: contactAvatar,
        callerName: callerName,
        callerAvatar: callerAvatar,
        callStartTime: callStartTime
    };
    sessionStorage.setItem('activeCallData', JSON.stringify(activeCallData));
    
    // Chuyển đến active call trong cùng cửa sổ sau delay ngắn
    setTimeout(() => {
        // Thông báo cho trang parent (messages) về việc cuộc gọi đã bắt đầu
        if (window.opener) {
            window.opener.postMessage({
                type: 'call-connected',
                data: { contactId, contactName, callType }
            }, window.location.origin);
        }
        
        // Chuyển đến trang active call trong cùng cửa sổ
        window.location.href = '/active-call';
    }, 1500);
}

// Function kết thúc cuộc gọi
function endCall() {
    console.log(`Cuộc gọi ${callType} tới ${contactName} kết thúc`);
    
    // Stop outgoing ringtone immediately
    console.log('🔇 Stopping outgoing ringtone...');
    audioManager.stopAllSounds();
    
    // Disable button để tránh double click
    endCallBtn.disabled = true;
    
    // Dừng timeout
    if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
    }
    
    // Cập nhật UI
    callStatus.textContent = 'Đã kết thúc cuộc gọi';
    callStatus.className = 'text-lg text-gray-400 mt-2';
    
    // Send message to parent window about call end
    if (window.opener) {
        window.opener.postMessage({
            type: 'call-ended',
            data: { contactId, contactName, callType }
        }, window.location.origin);
    }
    
    // Clear call data
    sessionStorage.removeItem('currentCallData');
    
    // Đóng trang hiện tại sau delay ngắn
    setTimeout(() => {
        window.close();
        
        // Fallback: Nếu không thể đóng cửa sổ, chuyển về messages
        setTimeout(() => {
            window.location.href = '/messages';
        }, 100);
    }, 1000);
}

// Event listeners
endCallBtn.addEventListener('click', endCall);

// Cleanup khi đóng trang
window.addEventListener('beforeunload', () => {
    console.log('🔇 Page unloading - stopping all sounds...');
    audioManager.stopAllSounds();
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        endCall();
    }
});

// Bắt đầu cuộc gọi khi trang load
startOutgoingCall();
