// Import CSS
import "./TTS.css";

const TTS = (props) => {
  function readAudio(textToRead) {
    var msg = new SpeechSynthesisUtterance(textToRead);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }

  return (
    <button className="tts_play" onClick={() => readAudio(props.text.trim().length === 0 ? "Aucune description saisie pour cette annotation" : props.text)}>READ AUDIO</button>
  )

}

export default TTS;