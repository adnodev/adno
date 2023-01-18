import { generateUUID } from "../../../Utils/utils";

class RichEditorImage {
  static get toolbox() {
    return {
      title: 'Image',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
    };
  }

  constructor({ data, readOnly }) {
    this.data = data;
    this.wrapper = undefined;
    this.readOnly = readOnly;
    this.imgID = generateUUID()
  }

  render() {
    this.wrapper = document.createElement('div');

    if (this.readOnly) {
      // Load the image
      this.data && this.data.url && this.createImage(this.data.url);

    } else {
      // Input to insert the URL
      this.buildUrlInput()

      // Load the image
      this.data && this.data.url && this.createImage(this.data.url);
    }

    return this.wrapper;
  }

  buildUrlInput() {
    const input = document.createElement('input');

    input.classList.add('cdx-input', 'image-tool__caption');

    input.placeholder = 'Paste an image URL...';
    input.value = this.data && this.data.url ? this.data.url : '';

    input.addEventListener('paste', (event) => {
      this.createImage(event.clipboardData.getData('text'));
    });

    this.wrapper.appendChild(input);
  }

  buildCaptionText() {
    const caption_text = document.createElement('p');
    caption_text.innerText = this.data && this.data.caption ? this.data.caption : "Aucune légende n'a été renseignée";

    this.wrapper.appendChild(caption_text);
  }

  buildCaptionInput() {
    const caption_input = document.createElement('input');

    caption_input.classList.add('cdx-input', 'image-tool__caption');
    caption_input.placeholder = 'Add a caption to the image';
    caption_input.value = this.data && this.data.caption ? this.data.caption : '';
    caption_input.id = "caption_input"

    this.wrapper.appendChild(caption_input);

    caption_input.addEventListener('input', (event) => {
      this.data.caption = event.target.value;
    });
  }

  createImage(url) {
    if (document.getElementById(`adno_edjs_img_${this.imgID}`)) {
      const image = document.getElementById(`adno_edjs_img_${this.imgID}`)

      image.src = url;
    } else {
      const image = document.createElement('img');
      image.id = `adno_edjs_img_${this.imgID}`

      image.src = url;

      console.log("ici");

      this.wrapper.appendChild(image);

      if(this.readOnly){
        this.buildCaptionText()
      }else{
        this.buildCaptionInput()
      }
    }
  }

  save(blockContent) {
    const img = document.getElementById(`adno_edjs_img_${this.imgID}`)
    const caption = blockContent.querySelector('#caption_input');

    return {
      url: img && img.src || "",
      caption: caption && caption.value || "",
    }
  }

  static get isReadOnlySupported() {
    return true;
  }
}

export default RichEditorImage



