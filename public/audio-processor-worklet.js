const MIN_INT16 = -0x8000;
const MAX_INT16 = 0x7fff;

class PCMAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const float32Buffer = input[0];
            const int16Buffer = this.float32ToInt16(float32Buffer);
            this.port.postMessage(int16Buffer);
        }
        return true;
    }

    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let val = Math.floor(float32Array[i] * MAX_INT16);
            val = Math.max(MIN_INT16, Math.min(MAX_INT16, val));
            int16Array[i] = val;
        }
        return int16Array;
    }
}

registerProcessor("audio-processor-worklet", PCMAudioProcessor);
