export const extractWatermark = (audioData, watermarkSignal) => {
  // Convert audio data to samples
  const audioSamples = convertAudioDataToSamples(audioData);

  const embededAudioWaterMarking = embedWatermark(
    audioSamples,
    watermarkSignal
  );

  // Perform correlation-based extraction
  const correlationResult = correlate(
    embededAudioWaterMarking,
    watermarkSignal
  );

  // Find peak correlation to locate watermark in audio signal
  const peakIndex = findPeakIndex(correlationResult);

  // Extract watermark data based on peak index
  const extractedWatermark = extractWatermarkFromIndex(
    embededAudioWaterMarking,
    peakIndex,
    watermarkSignal.length
  );

  // Additional details about the audio data
  const audioDetails = {
    sampleRate: audioData.sampleRate, // Replace with actual sample rate if known
    numberOfChannels: audioData.numberOfChannels, // Replace with actual number of channels if known
    durationInSeconds: audioData.length / 44100, // Calculate duration based on sample rate
    correlationResult: correlationResult, // Store correlation result for analysis if needed
    peakIndex: peakIndex, // Store peak index for further inspection
  };

  return {
    extractedWatermark: extractedWatermark,
    audioDetails: audioDetails,
  };
};

// Function to embed watermark into audio data
const embedWatermark = (audioSamples, watermarkSignal) => {
  // Simulate embedding by simply appending the watermark signal to audio samples
  const embeddedSamples = [...audioSamples, ...watermarkSignal];
  return embeddedSamples;
};

// Convert audio data to samples (e.g., PCM data)
const convertAudioDataToSamples = (audioData) => {
  // Example conversion for PCM data (16-bit signed)
  const samples = [];
  for (let i = 0; i < audioData.length; i += 2) {
    const sample = audioData[i] | (audioData[i + 1] << 8); // Combine 2 bytes into a 16-bit sample
    samples.push(sample);
  }
  return samples;
};

// Perform cross-correlation between audio samples and watermark signal
const correlate = (audioSamples, watermarkSignal) => {
  const correlationResult = [];
  const watermarkLength = watermarkSignal.length;

  // Cross-correlation calculation
  for (let i = 0; i < audioSamples.length - watermarkLength; i++) {
    let correlation = 0;
    for (let j = 0; j < watermarkLength; j++) {
      correlation += audioSamples[i + j] * watermarkSignal[j];
    }
    correlationResult.push(correlation);
  }

  return correlationResult;
};

// Find index with maximum correlation (peak detection)
const findPeakIndex = (correlationResult) => {
  return correlationResult.reduce(
    (maxIndex, currentValue, currentIndex, array) => {
      return currentValue > array[maxIndex] ? currentIndex : maxIndex;
    },
    0
  );
};

// Extract watermark from audio samples based on peak index
const extractWatermarkFromIndex = (
  audioSamples,
  peakIndex,
  watermarkLength
) => {
  return audioSamples.slice(peakIndex, peakIndex + watermarkLength);
};
