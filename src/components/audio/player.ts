export class Player {
    private playbackNode: AudioWorkletNode | null = null;
    private audioContext: AudioContext | null = null;

    async init(sampleRate: number) {
        this.audioContext = new AudioContext({ sampleRate });
        await this.audioContext.audioWorklet.addModule("/audio-playback-worklet.js");

        this.playbackNode = new AudioWorkletNode(this.audioContext, "audio-playback-worklet");
        this.playbackNode.connect(this.audioContext.destination);
    }

    play(buffer: Int16Array) {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(buffer);
        }
    }

    stop() {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(null);
        }
    }

    async close() {
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        this.playbackNode = null;
    }
}
