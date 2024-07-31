import "./App.css";
import { useState, useRef, ChangeEvent } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { extractWatermark } from "./services/watermarking";

const ffmpeg = new FFmpeg();

const App = () => {
  const [loaded, setLoaded] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioWav, setAudioWav] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);

  const watermarkSignal = [0, 1, 0, 1, 1, 0, 1, 0, 1]; // Example watermark signal

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const messageRef = useRef(null);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      if (file.type === "video/mp4" && videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.style.display = "block";
      } else if (file.type === "audio/mp3" && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.style.display = "block";
      }
    }
  };

  const handleInputsSource = async () => {
    if (!audioFile) return;

    const fileType = audioFile.endsWith(".mp4") ? "mp4" : "mp3";

    await ffmpeg.writeFile(`input.${fileType}`, await fetchFile(audioFile));
    await ffmpeg.exec(["-i", `input.${fileType}`, "output.wav"]);

    const fileData = await ffmpeg.readFile("output.wav");
    const data = new Uint8Array(fileData);
    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(
        new Blob([data.buffer], { type: "audio/wav" })
      );
    }

    const wavBlobUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "audio/wav" })
    );
    setAudioWav(wavBlobUrl);
  };

  const embedAndExtractAudio = async () => {
    try {
      const arrayBuffer = await fetch(audioWav).then((res) =>
        res.arrayBuffer()
      );
      const audioCtx = new (window.AudioContext || window.AudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
    } catch (error) {
      console.error("Error decoding audio file:", error);
    }
  };

  const extractedWatermark =
    audioBuffer && extractWatermark(audioBuffer, watermarkSignal);

  return (
    <>
      <h1>Watermark Detection</h1>
      {!audioBuffer ? (
        <div>
          {!loaded && <button onClick={load}>Load ffmpeg-core</button>}
          <div className="media--container">
            {loaded && (
              <input
                type="file"
                id="inputFile"
                accept=".mp3, .mp4"
                onChange={handleFileChange}
              />
            )}
            {audioFile && (
              <>
                <video ref={videoRef} controls width="300">
                  <source src={audioFile} type="video/mp4" />
                </video>
                <button onClick={handleInputsSource}>
                  Process Audio & Convert to .wav
                </button>
              </>
            )}
          </div>
          {audioWav && (
            <div className="media--container__two">
              <audio ref={audioRef} controls>
                <source src={audioWav} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
              <button onClick={embedAndExtractAudio}>
                Embed & Extract Audio
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ backgroundColor: "white", height: "25vh", color: "black" }}
        >
          <div>
            <h3>
              <strong>extractedWatermark :</strong>
              {extractedWatermark["extractedWatermark"]}{" "}
            </h3>
          </div>
          <div>
            <li>
              <strong>durationInSeconds :</strong>
              {extractedWatermark["audioDetails"]["durationInSeconds"]}
            </li>
            <li>
              <strong>numberOfChannels :</strong>
              {extractedWatermark["audioDetails"]["numberOfChannels"]}
            </li>
            <li>
              <strong>peakIndex :</strong>
              {extractedWatermark["audioDetails"]["peakIndex"]}
            </li>
            <li>
              <strong>sampleRate :</strong>
              {extractedWatermark["audioDetails"]["sampleRate"]}
            </li>
            <li>
              <strong>correlationResult :</strong>
              {extractedWatermark["audioDetails"]["correlationResult"].length >
              10
                ? extractedWatermark["audioDetails"]["correlationResult"].length
                : extractedWatermark["audioDetails"]["correlationResult"]}{" "}
              length of array
            </li>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
