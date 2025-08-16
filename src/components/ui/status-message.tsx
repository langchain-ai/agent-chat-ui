interface StatusMessageProps {
  isRecording: boolean;
}

export default function StatusMessage({ isRecording }: StatusMessageProps) {
  return (
    <div className="mt-2 text-sm text-gray-600">
      {isRecording ? (
        <span className="text-red-600">🔴 Recording... Speak now</span>
      ) : (
        <span>Click the microphone to start a voice conversation with FieldGenie AI</span>
      )}
    </div>
  );
}
