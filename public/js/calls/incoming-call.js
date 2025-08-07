/**
 * Incoming Call JavaScript
 * Xử lý logic cho trang cuộc gọi đến
 */

lucide.createIcons();

// Initialize audio manager for incoming call
const audioManager = new CallAudioManager();

// Start playing incoming call ringtone immediately
console.log('🔊 Starting incoming call ringtone...');
audioManager.playIncoming(true);

// Lấy dữ liệu cuộc gọi từ sessionStorage
let callData = {};
try {
    const callDataString = sessionStorage.getItem('incomingCallData');
    if (callDataString) {
        callData = JSON.parse(callDataString);
    }
} catch (error) {
    console.error('Error loading incoming call data:', error);
}

// Fallback data nếu không có dữ liệu
const callType = callData.callType || 'voice';
const contactId = callData.contactId || '';
const contactName = callData.contactName || 'Người dùng';
const contactAvatar = callData.contactAvatar || '';
const callerName = callData.callerName || 'Bạn';
const callerAvatar = callData.callerAvatar || '';
const isVideoCall = callType === 'video';

// Lấy elements
const acceptButton = document.getElementById('accept-call');
const declineButton = document.getElementById('decline-call');
const callStatus = document.getElementById('call-status');
const callerNameElement = document.getElementById('caller-name');
const callerAvatarElement = document.getElementById('caller-avatar');
const backgroundElement = document.querySelector('.background-blur');

// Cập nhật UI với dữ liệu thật
function updateUIWithRealData() {
    if (callerNameElement) {
        callerNameElement.textContent = contactName;
    }
    
    if (callerAvatarElement) {
        if (contactAvatar) {
            callerAvatarElement.src = contactAvatar;
            callerAvatarElement.alt = contactName;
        } else {
            // Fallback avatar với chữ cái đầu
            const firstLetter = contactName.charAt(0).toUpperCase();
            callerAvatarElement.src = `https://placehold.co/160x160/6B7280/FFFFFF?text=${firstLetter}`;
            callerAvatarElement.alt = contactName;
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

    // Cập nhật UI dựa trên loại cuộc gọi
    if (isVideoCall) {
        document.title = `Cuộc gọi video từ ${contactName}`;
        callStatus.textContent = 'Cuộc gọi video đến...';
        
        // Thay đổi icon accept button thành video
        const acceptIcon = acceptButton.querySelector('i');
        acceptIcon.setAttribute('data-lucide', 'video');
        lucide.createIcons();
    } else {
        document.title = `Cuộc gọi từ ${contactName}`;
        callStatus.textContent = 'Cuộc gọi thoại đến...';
    }
}

// Xử lý chấp nhận cuộc gọi
function handleAcceptCall() {
    console.log(`Cuộc gọi ${callType} từ ${contactName} được chấp nhận`);
    
    // Stop incoming ringtone immediately
    console.log('🔇 Stopping incoming ringtone...');
    audioManager.stopAllSounds();
    
    // Disable buttons để tránh double click
    acceptButton.disabled = true;
    declineButton.disabled = true;
    
    // Cập nhật UI
    callStatus.textContent = 'Đang kết nối...';
    
    // Store active call data for active-call.html
    const activeCallData = {
        callType: callType,
        contactId: contactId,
        contactName: contactName,
        contactAvatar: contactAvatar,
        callerName: callerName,
        callerAvatar: callerAvatar,
        callStartTime: new Date()
    };
    sessionStorage.setItem('activeCallData', JSON.stringify(activeCallData));
    
    // Send message to parent window about call acceptance
    if (window.opener) {
        window.opener.postMessage({
            type: 'call-accepted',
            data: { contactId, contactName, callType }
        }, window.location.origin);
    }
    
    // Chuyển hướng sang trang active-call trong cùng cửa sổ
    window.location.href = '/active-call';
}

// Xử lý từ chối cuộc gọi
function handleDeclineCall() {
    console.log(`Cuộc gọi ${callType} từ ${contactName} bị từ chối`);
    
    // Stop incoming ringtone immediately
    console.log('🔇 Stopping incoming ringtone...');
    audioManager.stopAllSounds();
    
    // Disable buttons để tránh double click
    acceptButton.disabled = true;
    declineButton.disabled = true;
    
    // Cập nhật UI
    callStatus.textContent = 'Đã từ chối cuộc gọi';
    
    // Send message to parent window about call rejection
    if (window.opener) {
        window.opener.postMessage({
            type: 'call-rejected',
            data: { contactId, contactName, callType }
        }, window.location.origin);
    }
    
    // Clear incoming call data
    sessionStorage.removeItem('incomingCallData');
    
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
acceptButton.addEventListener('click', handleAcceptCall);
declineButton.addEventListener('click', handleDeclineCall);

// Cleanup khi đóng trang
window.addEventListener('beforeunload', () => {
    console.log('🔇 Page unloading - stopping all sounds...');
    audioManager.stopAllSounds();
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleAcceptCall();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        handleDeclineCall();
    }
});

// Auto-reject after timeout (optional)
const AUTO_REJECT_TIMEOUT = 60000; // 60 seconds
let autoRejectTimer = setTimeout(() => {
    console.log('Call auto-rejected due to timeout');
    callStatus.textContent = 'Cuộc gọi đã hết thời gian chờ';
    handleDeclineCall();
}, AUTO_REJECT_TIMEOUT);

// Clear auto-reject timer if user takes action
acceptButton.addEventListener('click', () => {
    if (autoRejectTimer) {
        clearTimeout(autoRejectTimer);
        autoRejectTimer = null;
    }
});

declineButton.addEventListener('click', () => {
    if (autoRejectTimer) {
        clearTimeout(autoRejectTimer);
        autoRejectTimer = null;
    }
});

// Initialize UI when page loads
updateUIWithRealData();
