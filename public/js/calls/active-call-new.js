/*
 * Active Call JavaScript - New Version
 * Xử lý các chức năng trong cuộc gọi đang diễn ra
 */

class ActiveCallManager {
    constructor() {
        this.callData = {};
        this.callStartTime = null;
        this.isCallActive = false;
        this.callTimerInterval = null;
        this.localStream = null;
        this.isMuted = false;
        this.isVideoMode = false;
        
        // Initialize audio manager
        this.audioManager = new CallAudioManager();
        
        this.init();
    }

    init() {
        this.loadCallData();
        this.initializeElements();
        this.initializeLucideIcons();
        this.bindEvents();
        this.checkMediaPermissions();
        this.startActiveCall();
    }

    loadCallData() {
        try {
            const callDataString = sessionStorage.getItem('activeCallData');
            if (callDataString) {
                this.callData = JSON.parse(callDataString);
            }
        } catch (error) {
            console.error('Error loading active call data:', error);
        }

        // Fallback data
        this.callData = {
            callType: this.callData.callType || 'voice',
            contactId: this.callData.contactId || '',
            contactName: this.callData.contactName || 'Người dùng',
            contactAvatar: this.callData.contactAvatar || '',
            callerName: this.callData.callerName || 'Bạn',
            callerAvatar: this.callData.callerAvatar || '',
            callStartTime: this.callData.callStartTime ? new Date(this.callData.callStartTime) : new Date(),
            ...this.callData
        };

        this.callStartTime = this.callData.callStartTime;
        this.isInitialVideoCall = this.callData.callType === 'video';
    }

    initializeElements() {
        // Voice call elements
        this.voiceCallScreen = document.getElementById('voice-call-screen');
        this.videoCallScreen = document.getElementById('video-call-screen');
        this.endCallBtn = document.getElementById('end-call');
        this.videoEndCallBtn = document.getElementById('video-end-call');
        this.muteBtn = document.getElementById('mute-btn');
        this.videoMuteBtn = document.getElementById('video-mute-btn');
        this.cameraBtn = document.getElementById('camera-btn');
        this.videoCameraBtn = document.getElementById('video-camera-btn');
        this.callTimer = document.getElementById('call-timer');
        this.videoCallTimer = document.getElementById('video-call-timer');
        this.callStatus = document.getElementById('call-status');
        this.localVideo = document.getElementById('local-video');
        this.remoteVideo = document.getElementById('remote-video');
        this.contactNameElement = document.getElementById('contact-name');
        this.contactAvatarElement = document.getElementById('contact-avatar');
        this.backgroundElement = document.querySelector('.background-blur');

        // Debug element existence
        console.log('🔍 Elements check:');
        console.log('endCallBtn:', this.endCallBtn ? '✅' : '❌');
        console.log('videoEndCallBtn:', this.videoEndCallBtn ? '✅' : '❌');
        console.log('muteBtn:', this.muteBtn ? '✅' : '❌');
        console.log('videoMuteBtn:', this.videoMuteBtn ? '✅' : '❌');
        console.log('cameraBtn:', this.cameraBtn ? '✅' : '❌');
        console.log('videoCameraBtn:', this.videoCameraBtn ? '✅' : '❌');
        console.log('callTimer:', this.callTimer ? '✅' : '❌');
        console.log('videoCallTimer:', this.videoCallTimer ? '✅' : '❌');
    }

    bindEvents() {
        // Call control events
        if (this.endCallBtn) {
            this.endCallBtn.addEventListener('click', () => {
                console.log('🔴 End call button clicked');
                this.endCall();
            });
        }
        
        if (this.videoEndCallBtn) {
            this.videoEndCallBtn.addEventListener('click', () => {
                console.log('🔴 Video end call button clicked');
                this.endCall();
            });
        }
        
        if (this.muteBtn) {
            this.muteBtn.addEventListener('click', () => {
                console.log('🎤 Mute button clicked');
                this.toggleMute();
            });
        }
        
        if (this.videoMuteBtn) {
            this.videoMuteBtn.addEventListener('click', () => {
                console.log('🎤 Video mute button clicked');
                this.toggleMute();
            });
        }
        
        if (this.cameraBtn) {
            this.cameraBtn.addEventListener('click', () => {
                console.log('📹 Camera button clicked');
                this.switchToVideoCall();
            });
        }
        
        if (this.videoCameraBtn) {
            this.videoCameraBtn.addEventListener('click', () => {
                console.log('📹 Video camera button clicked');
                this.switchToVoiceCall();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => this.handleKeyboardShortcuts(event));

        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    handleKeyboardShortcuts(event) {
        // Prevent shortcuts when focusing on inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key.toLowerCase()) {
            case 'm':
                event.preventDefault();
                this.toggleMute();
                break;
            case 'v':
                event.preventDefault();
                if (this.isVideoMode) {
                    this.switchToVoiceCall();
                } else {
                    this.switchToVideoCall();
                }
                break;
            case 'escape':
            case 'e':
                event.preventDefault();
                this.endCall();
                break;
        }
    }

    updateUIWithRealData() {
        // Update contact name
        if (this.contactNameElement) {
            this.contactNameElement.textContent = this.callData.contactName;
        }

        // Update video contact name
        const videoContactName = document.getElementById('video-contact-name');
        if (videoContactName) {
            videoContactName.textContent = this.callData.contactName;
        }

        // Update avatar
        if (this.contactAvatarElement) {
            if (this.callData.contactAvatar) {
                this.contactAvatarElement.src = this.callData.contactAvatar;
                this.contactAvatarElement.alt = this.callData.contactName;
            } else {
                const firstLetter = this.callData.contactName.charAt(0).toUpperCase();
                this.contactAvatarElement.src = `https://placehold.co/128x128/6B7280/FFFFFF?text=${firstLetter}`;
                this.contactAvatarElement.alt = this.callData.contactName;
            }
        }

        // Update background
        if (this.backgroundElement) {
            if (this.callData.contactAvatar) {
                this.backgroundElement.style.backgroundImage = `url('${this.callData.contactAvatar}')`;
            } else {
                const firstLetter = this.callData.contactName.charAt(0).toUpperCase();
                this.backgroundElement.style.backgroundImage = `url('https://placehold.co/600x800/6B7280/FFFFFF?text=${firstLetter}')`;
            }
        }

        // Update document title
        if (this.isInitialVideoCall) {
            document.title = `Video call với ${this.callData.contactName}`;
        } else {
            document.title = `Cuộc gọi với ${this.callData.contactName}`;
        }
    }

    async checkMediaPermissions() {
        try {
            if ('permissions' in navigator) {
                const cameraPermission = await navigator.permissions.query({name: 'camera'});
                const micPermission = await navigator.permissions.query({name: 'microphone'});
                
                console.log('Camera permission:', cameraPermission.state);
                console.log('Microphone permission:', micPermission.state);
                
                return {
                    camera: cameraPermission.state,
                    microphone: micPermission.state
                };
            }
        } catch (error) {
            console.log('Permission check not supported:', error);
        }
        return null;
    }

    startActiveCall() {
        this.isCallActive = true;
        this.updateUIWithRealData();
        
        // Play connection sound
        console.log('🔊 Playing connection sound...');
        this.audioManager.playConnected();
        
        if (this.callStatus) {
            this.callStatus.textContent = `Đã kết nối với ${this.callData.contactName}`;
        }

        console.log('🚀 Starting call timer...');
        this.startCallTimer();

        if (this.isInitialVideoCall) {
            this.startWithVideoCall();
        } else {
            this.startVoiceCall();
        }
    }

    async startWithVideoCall() {
        try {
            const permissions = await navigator.permissions.query({name: 'camera'});
            console.log('Camera permission status:', permissions.state);
            
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.localVideo.srcObject = this.localStream;
            this.simulateRemoteVideo();

            this.voiceCallScreen.classList.add('hidden');
            this.videoCallScreen.classList.remove('hidden');
            this.isVideoMode = true;

            console.log('Video call started successfully');
        } catch (error) {
            console.error('Lỗi khi truy cập camera/microphone:', error);
            
            let errorMessage = 'Không có quyền camera - Voice call';
            if (error.name === 'NotFoundError') {
                errorMessage = 'Không tìm thấy camera - Voice call';
            } else if (error.name !== 'NotAllowedError') {
                errorMessage = 'Lỗi camera - Voice call';
            }
            
            if (this.callStatus) {
                this.callStatus.textContent = errorMessage;
            }
            
            this.startVoiceCall();
        }
    }

    simulateRemoteVideo() {
        if (this.remoteVideo) {
            this.remoteVideo.style.backgroundImage = 'url(https://placehold.co/640x480/3b82f6/ffffff?text=Remote+Video)';
            this.remoteVideo.style.backgroundSize = 'cover';
            this.remoteVideo.style.backgroundPosition = 'center';
        }
    }

    async startVoiceCall() {
        try {
            console.log('Starting voice call...');
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            console.log('Microphone connected successfully');
            
            if (this.callStatus) {
                this.callStatus.textContent = `Đã kết nối với ${this.callData.contactName}`;
                this.callStatus.classList.remove('text-red-400');
                this.callStatus.classList.add('text-green-400');
            }
        } catch (error) {
            console.error('Lỗi khi truy cập microphone:', error);
            
            let errorMessage = 'Lỗi microphone';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Không có quyền microphone';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Không tìm thấy microphone';
            }
            
            if (this.callStatus) {
                this.callStatus.textContent = errorMessage;
                this.callStatus.classList.remove('text-green-400');
                this.callStatus.classList.add('text-red-400');
            }
            
            if (this.muteBtn) {
                this.muteBtn.disabled = true;
                this.muteBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    async switchToVideoCall() {
        try {
            console.log('Switching to video call...');
            
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    try {
                        track.stop();
                    } catch (error) {
                        console.error('Error stopping track:', error);
                    }
                });
            }

            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.localVideo.srcObject = this.localStream;
            this.simulateRemoteVideo();

            this.voiceCallScreen.classList.add('hidden');
            this.videoCallScreen.classList.remove('hidden');
            this.isVideoMode = true;

            // Update camera button
            const icon = this.cameraBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'video');
            this.cameraBtn.classList.remove('bg-gray-700');
            this.cameraBtn.classList.add('bg-blue-600');
            this.initializeLucideIcons();

            console.log('Switched to video call successfully');
        } catch (error) {
            console.error('Lỗi khi bật camera:', error);
            
            let errorMessage = 'Camera error';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is being used by another application';
            }
            
            if (this.callStatus) {
                const originalStatus = this.callStatus.textContent;
                this.callStatus.textContent = errorMessage;
                this.callStatus.classList.add('text-red-400');
                
                setTimeout(() => {
                    this.callStatus.textContent = originalStatus;
                    this.callStatus.classList.remove('text-red-400');
                }, 3000);
            }
        }
    }

    async switchToVoiceCall() {
        try {
            console.log('Switching to voice call...');
            
            if (this.localStream) {
                const videoTracks = this.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    try {
                        track.stop();
                        console.log('Stopped video track');
                    } catch (error) {
                        console.error('Error stopping video track:', error);
                    }
                });
            }

            const existingAudioTracks = this.localStream ? this.localStream.getAudioTracks() : [];
            
            if (existingAudioTracks.length > 0 && existingAudioTracks[0].readyState === 'live') {
                console.log('Keeping existing audio track');
            } else {
                if (this.localStream) {
                    this.localStream.getTracks().forEach(track => track.stop());
                }
                
                this.localStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: false 
                });
                console.log('Created new audio stream');
            }

            this.videoCallScreen.classList.add('hidden');
            this.voiceCallScreen.classList.remove('hidden');
            this.isVideoMode = false;

            // Update camera button
            const icon = this.cameraBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'video-off');
            this.cameraBtn.classList.remove('bg-blue-600');
            this.cameraBtn.classList.add('bg-gray-700');
            this.initializeLucideIcons();

            console.log('Switched to voice call successfully');
        } catch (error) {
            console.error('Lỗi khi tắt camera:', error);
            
            this.videoCallScreen.classList.add('hidden');
            this.voiceCallScreen.classList.remove('hidden');
            this.isVideoMode = false;
            
            const icon = this.cameraBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'video-off');
            this.cameraBtn.classList.remove('bg-blue-600');
            this.cameraBtn.classList.add('bg-gray-700');
            this.initializeLucideIcons();
        }
    }

    toggleMute() {
        if (!this.localStream) {
            console.warn('No local stream available for muting');
            return;
        }

        try {
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                this.isMuted = !this.isMuted;
                audioTracks[0].enabled = !this.isMuted;

                const voiceIcon = this.muteBtn.querySelector('i');
                const videoIcon = this.videoMuteBtn.querySelector('i');
                const muteIndicator = document.getElementById('mute-indicator');

                if (this.isMuted) {
                    voiceIcon.setAttribute('data-lucide', 'mic-off');
                    videoIcon.setAttribute('data-lucide', 'mic-off');
                    this.muteBtn.classList.remove('bg-gray-700');
                    this.muteBtn.classList.add('bg-red-500');
                    this.videoMuteBtn.classList.remove('bg-gray-700');
                    this.videoMuteBtn.classList.add('bg-red-500');
                    
                    if (muteIndicator) {
                        muteIndicator.classList.remove('hidden');
                    }
                    
                    console.log('Microphone muted');
                } else {
                    voiceIcon.setAttribute('data-lucide', 'mic');
                    videoIcon.setAttribute('data-lucide', 'mic');
                    this.muteBtn.classList.remove('bg-red-500');
                    this.muteBtn.classList.add('bg-gray-700');
                    this.videoMuteBtn.classList.remove('bg-red-500');
                    this.videoMuteBtn.classList.add('bg-gray-700');
                    
                    if (muteIndicator) {
                        muteIndicator.classList.add('hidden');
                    }
                    
                    console.log('Microphone unmuted');
                }

                this.initializeLucideIcons();
            } else {
                console.warn('No audio tracks found');
            }
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    }

    startCallTimer() {
        this.callStartTime = new Date();
        console.log('📞 Call timer started at:', this.callStartTime);
        this.callTimerInterval = setInterval(() => this.updateCallTimer(), 1000);
        this.updateCallTimer();
    }

    updateCallTimer() {
        if (!this.callStartTime) {
            console.warn('⚠️ No callStartTime available for timer update');
            return;
        }
        
        const now = new Date();
        const elapsed = Math.floor((now - this.callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        let timerUpdated = false;
        if (this.callTimer) {
            this.callTimer.textContent = timeString;
            timerUpdated = true;
        }
        if (this.videoCallTimer) {
            this.videoCallTimer.textContent = timeString;
            timerUpdated = true;
        }
        
        if (!timerUpdated) {
            document.title = `[${timeString}] Cuộc gọi với ${this.callData.contactName}`;
            console.log('⚠️ Using title fallback for timer display');
        }
        
        if (elapsed % 10 === 0) {
            console.log(`📞 Call duration: ${timeString} (${elapsed}s)`);
        }
    }

    endCall() {
        console.log(`Cuộc gọi ${this.callData.callType} với ${this.callData.contactName} kết thúc`);
        
        // Play end call sound
        console.log('🔊 Playing end call sound...');
        this.audioManager.playEnded();
        
        try {
            if (this.callTimerInterval) {
                clearInterval(this.callTimerInterval);
                this.callTimerInterval = null;
                console.log('📞 Call timer stopped');
            }
            
            this.cleanup();
            
            this.isCallActive = false;
            this.isMuted = false;
            this.isVideoMode = false;
            this.callStartTime = null;
            
            console.log('Call ended successfully');
            
            sessionStorage.removeItem('activeCallData');
            
        } catch (error) {
            console.error('Error ending call:', error);
        }
        
        // Delay redirect to let sound play
        setTimeout(() => {
            try {
                window.close();
            } catch (error) {
                console.log('Cannot close window, redirecting...');
                window.location.href = '/messages.html';
            }
        }, 600); // Wait for end sound to play
    }
    }

    cleanup() {
        // Stop all audio
        if (this.audioManager) {
            this.audioManager.stopAllSounds();
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                try {
                    track.stop();
                    console.log(`Stopped ${track.kind} track`);
                } catch (error) {
                    console.error(`Error stopping ${track.kind} track:`, error);
                }
            });
            this.localStream = null;
        }
    }

    initializeLucideIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    addTooltips() {
        if (this.muteBtn) this.muteBtn.title = 'Tắt/Bật tiếng (M)';
        if (this.videoMuteBtn) this.videoMuteBtn.title = 'Tắt/Bật tiếng (M)';
        if (this.cameraBtn) this.cameraBtn.title = 'Bật camera (V)';
        if (this.videoCameraBtn) this.videoCameraBtn.title = 'Tắt camera (V)';
        if (this.endCallBtn) this.endCallBtn.title = 'Kết thúc cuộc gọi (E hoặc ESC)';
        if (this.videoEndCallBtn) this.videoEndCallBtn.title = 'Kết thúc cuộc gọi (E hoặc ESC)';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.activeCallManager = new ActiveCallManager();
    
    // Additional DOM checks after delay
    setTimeout(() => {
        console.log('🔍 Final timer elements check (after 2s):');
        const finalCallTimer = document.getElementById('call-timer');
        const finalVideoCallTimer = document.getElementById('video-call-timer');
        
        console.log('Final callTimer:', finalCallTimer ? '✅' : '❌');
        console.log('Final videoCallTimer:', finalVideoCallTimer ? '✅' : '❌');
        
        if (finalCallTimer) {
            console.log('Current timer text:', finalCallTimer.textContent);
        }
    }, 2000);
});

// Legacy support - initialize immediately if DOM already loaded
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already loaded
    window.activeCallManager = new ActiveCallManager();
}
