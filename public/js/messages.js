// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors ---
    const chatContainer = document.getElementById('chat-container');
    const overlay = document.getElementById('drag-drop-overlay');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const brandName = document.getElementById('brand-name');
    const navTexts = document.querySelectorAll('.nav-text');
    const toggleIconCollapse = document.getElementById('toggle-icon-collapse');
    const toggleIconExpand = document.getElementById('toggle-icon-expand');

    // Call buttons in header
    const voiceCallBtn = document.getElementById('voice-call-btn');
    const videoCallBtn = document.getElementById('video-call-btn');
    const testIncomingCallBtn = document.getElementById('test-incoming-call-btn');
    
    // Message input elements
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const encryptionStatusIndicator = document.getElementById('encryption-status');

    // --- Encryption Variables ---
    let isEncryptionEnabled = true;
    let currentConversationId = null;
    let currentReceiverId = null;
    let userPrivateKey = null;

    // --- Initialize Encryption ---
    async function initializeEncryption() {
        try {
            console.log('🔐 Khởi tạo encryption cho messages...');
            
            await window.ClientEncryptionService.initializeUserEncryption();
            updateEncryptionStatus(true);
            
            console.log('✅ Encryption đã được khởi tạo thành công');
        } catch (error) {
            console.error('❌ Lỗi khởi tạo encryption:', error);
            updateEncryptionStatus(false);
            isEncryptionEnabled = false;
        }
    }

    // --- Update Encryption Status UI ---
    function updateEncryptionStatus(enabled) {
        if (encryptionStatusIndicator) {
            if (enabled) {
                encryptionStatusIndicator.innerHTML = `
                    <span class="flex items-center text-green-600">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                        </svg>
                        Mã hóa đầu cuối
                    </span>
                `;
                encryptionStatusIndicator.title = 'Tin nhắn được mã hóa đầu cuối';
            } else {
                encryptionStatusIndicator.innerHTML = `
                    <span class="flex items-center text-red-600">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 1L5 6v6l5 5 5-5V6l-5-5zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                        </svg>
                        Không mã hóa
                    </span>
                `;
                encryptionStatusIndicator.title = 'Tin nhắn không được mã hóa';
            }
        }
    }

    // --- Send Encrypted Message ---
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        
        if (!messageText || !currentReceiverId) {
            console.log('⚠️ Không có tin nhắn hoặc receiver để gửi');
            return;
        }
        
        try {
            console.log('📤 Đang gửi tin nhắn...', { encrypted: isEncryptionEnabled });
            
            let messageData = {
                receiverId: currentReceiverId,
                conversationId: currentConversationId,
                content: messageText,
                isEncrypted: isEncryptionEnabled
            };
            
            // Mã hóa tin nhắn nếu encryption được bật
            if (isEncryptionEnabled) {
                console.log('🔐 Đang mã hóa tin nhắn...');
                
                const encryptedData = await window.ClientEncryptionService.encryptMessage(
                    messageText, 
                    currentReceiverId
                );
                
                messageData.encryptedContent = encryptedData.encryptedContent;
                messageData.iv = encryptedData.iv;
                messageData.authTag = encryptedData.authTag;
                messageData.senderEncryptedKey = encryptedData.senderEncryptedKey;
                messageData.receiverEncryptedKey = encryptedData.receiverEncryptedKey;
                messageData.messageHash = encryptedData.messageHash;
                
                // Không gửi content plaintext khi mã hóa
                delete messageData.content;
                
                console.log('✅ Tin nhắn đã được mã hóa');
            }
            
            // Gửi tin nhắn lên server
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Tin nhắn đã được gửi thành công');
                
                // Hiển thị tin nhắn trong UI
                displayMessage({
                    ...result.data,
                    content: messageText, // Hiển thị text gốc
                    isSender: true
                });
                
                // Clear input
                messageInput.value = '';
                
            } else {
                console.error('❌ Lỗi gửi tin nhắn:', result.message);
                alert('Lỗi gửi tin nhắn: ' + result.message);
            }
            
        } catch (error) {
            console.error('❌ Lỗi gửi tin nhắn:', error);
            alert('Lỗi gửi tin nhắn: ' + error.message);
        }
    }

    // --- Display Message in UI ---
    function displayMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `flex ${message.isSender ? 'justify-end' : 'justify-start'} mb-4`;
        
        const isEncrypted = message.isEncrypted || message.encryptedContent;
        
        messageElement.innerHTML = `
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isSender 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'
            }">
                <div class="text-sm">${escapeHtml(message.content)}</div>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-xs opacity-75">
                        ${new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                    ${isEncrypted ? `
                        <svg class="w-3 h-3 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                        </svg>
                    ` : ''}
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- Load Conversation Messages ---
    async function loadConversationMessages(conversationId, receiverId) {
        try {
            console.log('📥 Đang tải tin nhắn cuộc trò chuyện...', { conversationId, receiverId });
            
            currentConversationId = conversationId;
            currentReceiverId = receiverId;
            
            const response = await fetch(`/api/messages/conversation/${conversationId}`);
            const result = await response.json();
            
            if (result.success) {
                const messages = result.data;
                console.log('✅ Đã tải được', messages.length, 'tin nhắn');
                
                // Clear messages container
                const messagesContainer = document.getElementById('messages-container');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                }
                
                // Giải mã và hiển thị từng tin nhắn
                for (const message of messages) {
                    await displayDecryptedMessage(message);
                }
                
            } else {
                console.error('❌ Lỗi tải tin nhắn:', result.message);
            }
            
        } catch (error) {
            console.error('❌ Lỗi tải tin nhắn:', error);
        }
    }

    // --- Display Decrypted Message ---
    async function displayDecryptedMessage(message) {
        let displayContent = message.content;
        
        // Giải mã tin nhắn nếu cần
        if (message.isEncrypted && message.encryptedContent) {
            try {
                if (!userPrivateKey) {
                    // Lấy private key từ server (trong thực tế nên cache này)
                    console.log('🔑 Lấy private key để giải mã...');
                    // Đây là demo, trong thực tế private key nên được bảo vệ tốt hơn
                }
                
                const encryptedKey = message.senderId === currentUserId 
                    ? message.senderEncryptedKey 
                    : message.receiverEncryptedKey;
                
                const decryptedResult = await window.ClientEncryptionService.decryptMessage(
                    {
                        encryptedContent: message.encryptedContent,
                        iv: message.iv,
                        authTag: message.authTag,
                        messageHash: message.messageHash
                    },
                    encryptedKey,
                    userPrivateKey // Cần implement lấy private key
                );
                
                displayContent = decryptedResult.message;
                
                if (!decryptedResult.hashVerified) {
                    console.warn('⚠️ Hash không khớp cho tin nhắn:', message._id);
                }
                
            } catch (error) {
                console.error('❌ Lỗi giải mã tin nhắn:', error);
                displayContent = '[Tin nhắn không thể giải mã]';
            }
        }
        
        displayMessage({
            ...message,
            content: displayContent,
            isSender: message.senderId === currentUserId
        });
    }

    // --- Utility Functions ---
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Event Listeners ---
    
    // Send message button
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    // Send message on Enter
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Initialize encryption when page loads
    initializeEncryption();

    // Show overlay when a file is dragged over the chat container
    chatContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    });

    // Hide overlay when the dragged file leaves the overlay area
    overlay.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    });

    // Prevent default behavior for dragover to allow dropping
    overlay.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // Handle the file drop
    overlay.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        
        // Get the dropped files from the event
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files);
        
        // TODO: Implement file upload logic here
        // For example, you could create a FormData object and send it via fetch.
    });


    // --- Sidebar Toggle Functionality ---
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            // Toggle sidebar width
            sidebar.classList.toggle('w-64'); // Expanded width
            sidebar.classList.toggle('w-20');   // Collapsed width

            // Toggle main content margin to adjust its position
            mainContent.classList.toggle('ml-72'); // Margin for expanded sidebar
            mainContent.classList.toggle('ml-24');  // Margin for collapsed sidebar

            // Hide or show the brand name and navigation text
            brandName.classList.toggle('hidden');
            toggleIconCollapse.classList.toggle('hidden');
            toggleIconExpand.classList.toggle('hidden');
            
            navTexts.forEach(text => {
                text.classList.toggle('hidden');
                
                // Center the icons when the text is hidden
                const parentLink = text.parentElement;
                if (parentLink) {
                   parentLink.classList.toggle('justify-center');
                }
            });
        });
    }

    // --- Call Functionality ---
    
    // Voice call button
    if (voiceCallBtn) {
        voiceCallBtn.addEventListener('click', () => {
            console.log('Voice call initiated');
            // Mở cuộc gọi trong cửa sổ popup
            const callWindow = window.open(
                '/outgoing-call?type=voice&contact=An Nguyễn',
                'outgoing-call',
                'width=480,height=720,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no'
            );
            
            // Lắng nghe messages từ popup call
            window.addEventListener('message', handleCallMessage);
        });
    }

    // Video call button  
    if (videoCallBtn) {
        videoCallBtn.addEventListener('click', () => {
            console.log('Video call initiated');
            // Mở cuộc gọi trong cửa sổ popup
            const callWindow = window.open(
                '/outgoing-call?type=video&contact=An Nguyễn',
                'outgoing-call',
                'width=480,height=720,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no'
            );
            
            // Lắng nghe messages từ popup call
            window.addEventListener('message', handleCallMessage);
        });
    }

    // Test incoming call button
    if (testIncomingCallBtn) {
        testIncomingCallBtn.addEventListener('click', () => {
            console.log('Test incoming call initiated');
            
            // Set up incoming call data
            const incomingCallData = {
                callType: 'voice',
                contactId: 'test-caller',
                contactName: 'Test Caller',
                contactAvatar: '',
                callerName: 'Test Caller',
                callerAvatar: ''
            };
            
            // Store data for incoming call page
            sessionStorage.setItem('incomingCallData', JSON.stringify(incomingCallData));
            
            // Mở incoming call trong cửa sổ popup
            const callWindow = window.open(
                '/incoming-call',
                'incoming-call',
                'width=480,height=720,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no'
            );
            
            // Lắng nghe messages từ popup call
            window.addEventListener('message', handleCallMessage);
        });
    }

    // Xử lý messages từ popup call
    function handleCallMessage(event) {
        if (event.origin !== window.location.origin) return;
        
        const { type, data } = event.data;
        
        switch (type) {
            case 'call-connected':
                console.log(`Cuộc gọi ${data.callType} với ${data.contactName} đã được kết nối`);
                // Có thể hiển thị notification hoặc cập nhật UI
                break;
                
            case 'call-ended':
                console.log(`Cuộc gọi ${data.callType} với ${data.contactName} đã kết thúc`);
                // Có thể hiển thị thông báo hoặc cập nhật trạng thái
                break;
                
            case 'call-accepted':
                console.log(`Cuộc gọi ${data.callType} từ ${data.contactName} đã được chấp nhận`);
                // Có thể hiển thị thông báo
                break;
                
            case 'call-rejected':
                console.log(`Cuộc gọi ${data.callType} từ ${data.contactName} đã bị từ chối`);
                // Có thể hiển thị thông báo
                break;
        }
    }
});
