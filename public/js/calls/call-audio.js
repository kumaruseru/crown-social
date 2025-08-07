/*
 * Call Audio Manager
 * Quản lý âm thanh cho cuộc gọi (chuông chờ, chuông nhận)
 */

class CallAudioManager {
    constructor() {
        this.sounds = {
            ringing: null,        // Âm thanh chuông chờ (outgoing call)
            incoming: null,       // Âm thanh chuông nhận (incoming call)
            connected: null,      // Âm thanh kết nối
            ended: null,          // Âm thanh kết thúc
            notification: null    // Âm thanh thông báo
        };
        
        this.currentAudio = null;
        this.isPlaying = false;
        this.volume = 0.5;
        
        this.initializeSounds();
    }

    initializeSounds() {
        // Tạo âm thanh chuông chờ (outgoing call)
        this.sounds.ringing = this.createAudioElement({
            frequency: 440,  // A4 note
            type: 'sine',
            duration: 1000,
            gap: 2000,
            loop: true
        });

        // Tạo âm thanh chuông nhận (incoming call)
        this.sounds.incoming = this.createAudioElement({
            frequency: 523,  // C5 note
            type: 'sine', 
            duration: 800,
            gap: 1200,
            loop: true
        });

        // Âm thanh kết nối
        this.sounds.connected = this.createAudioElement({
            frequency: 660,  // E5 note
            type: 'sine',
            duration: 200,
            gap: 100,
            repeat: 2
        });

        // Âm thanh kết thúc
        this.sounds.ended = this.createAudioElement({
            frequency: 220,  // A3 note
            type: 'sine',
            duration: 500,
            gap: 0,
            repeat: 1
        });
    }

    createAudioElement(config) {
        try {
            // Sử dụng Web Audio API để tạo âm thanh
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const createTone = (frequency, duration, type = 'sine') => {
                return new Promise((resolve) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = frequency;
                    oscillator.type = type;
                    
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration / 1000);
                    
                    oscillator.onended = () => resolve();
                });
            };

            return {
                context: audioContext,
                config: config,
                createTone: createTone,
                isPlaying: false,
                intervalId: null
            };
        } catch (error) {
            console.warn('Web Audio API not supported, using fallback');
            return this.createFallbackAudio(config);
        }
    }

    createFallbackAudio(config) {
        // Fallback sử dụng HTML5 Audio với data URL
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 100;
        
        // Tạo waveform đơn giản
        const sampleRate = 44100;
        const duration = config.duration / 1000;
        const samples = Math.floor(sampleRate * duration);
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);
        
        // Generate sine wave
        for (let i = 0; i < samples; i++) {
            const sample = Math.sin(2 * Math.PI * config.frequency * i / sampleRate) * 0x7FFF;
            view.setInt16(44 + i * 2, sample, true);
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' });
        const audio = new Audio(URL.createObjectURL(blob));
        audio.volume = this.volume;
        
        return {
            audio: audio,
            config: config,
            isPlaying: false,
            intervalId: null
        };
    }

    async playSound(soundName, options = {}) {
        console.log(`🔊 Playing sound: ${soundName}`);
        
        this.stopCurrentSound();
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }

        this.currentAudio = sound;
        this.isPlaying = true;
        
        const loop = options.loop !== undefined ? options.loop : sound.config.loop;
        const volume = options.volume !== undefined ? options.volume : this.volume;
        
        try {
            if (sound.createTone) {
                // Web Audio API
                await this.playWebAudioSound(sound, loop, volume);
            } else if (sound.audio) {
                // HTML5 Audio fallback
                await this.playHtml5Sound(sound, loop, volume);
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    async playWebAudioSound(sound, loop, volume) {
        const playSequence = async () => {
            if (!this.isPlaying) return;
            
            await sound.createTone(sound.config.frequency, sound.config.duration, sound.config.type);
            
            if (!this.isPlaying) return;
            
            if (sound.config.gap > 0) {
                await this.sleep(sound.config.gap);
            }
            
            if (loop && this.isPlaying) {
                playSequence();
            }
        };
        
        playSequence();
    }

    async playHtml5Sound(sound, loop, volume) {
        sound.audio.volume = volume;
        sound.audio.loop = loop;
        
        try {
            await sound.audio.play();
        } catch (error) {
            console.warn('Could not play audio:', error);
        }
    }

    stopCurrentSound() {
        if (!this.currentAudio) return;
        
        console.log('🔇 Stopping current sound');
        this.isPlaying = false;
        
        if (this.currentAudio.intervalId) {
            clearInterval(this.currentAudio.intervalId);
            this.currentAudio.intervalId = null;
        }
        
        if (this.currentAudio.audio) {
            this.currentAudio.audio.pause();
            this.currentAudio.audio.currentTime = 0;
        }
        
        if (this.currentAudio.context) {
            try {
                this.currentAudio.context.close();
            } catch (error) {
                console.warn('Error closing audio context:', error);
            }
        }
        
        this.currentAudio.isPlaying = false;
        this.currentAudio = null;
    }

    stopAllSounds() {
        console.log('🔇 Stopping all sounds');
        this.stopCurrentSound();
        
        // Stop any remaining sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound && sound.audio) {
                sound.audio.pause();
                sound.audio.currentTime = 0;
            }
            if (sound && sound.intervalId) {
                clearInterval(sound.intervalId);
                sound.intervalId = null;
            }
        });
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.currentAudio && this.currentAudio.audio) {
            this.currentAudio.audio.volume = this.volume;
        }
        
        console.log(`🔊 Volume set to: ${this.volume}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Convenience methods
    playRinging(loop = true) {
        return this.playSound('ringing', { loop });
    }

    playIncoming(loop = true) {
        return this.playSound('incoming', { loop });
    }

    playConnected() {
        return this.playSound('connected', { loop: false });
    }

    playEnded() {
        return this.playSound('ended', { loop: false });
    }

    playNotification() {
        return this.playSound('notification', { loop: false });
    }
}

// Export cho sử dụng global
window.CallAudioManager = CallAudioManager;
