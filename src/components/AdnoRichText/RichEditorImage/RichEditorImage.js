class RichEditorImage {
  static get toolbox() {
    return {
      title: 'Image',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
    };
  }

  constructor({ data }) {
    this.data = data;
    this.wrapper = undefined;
  }

  render() {
    this.wrapper = document.createElement('div');
    const input = document.createElement('input');

    input.classList.add('cdx-input', 'image-tool__caption');
    this.wrapper.appendChild(input);

    input.placeholder = 'Paste an image URL...';
    input.value = this.data && this.data.url ? this.data.url : '';

    this.data && this.data.url && this.createImage(this.data.url);

    input.addEventListener('paste', (event) => {
      this.createImage(event.clipboardData.getData('text'));
    });

    return this.wrapper;
  }

  createImage(url) {
    const image = document.createElement('img');

    image.src = url;

    // We clean the latest img
    for (let index = 0; index < this.wrapper.children.length; index++) {
      if (this.wrapper.children[index].tagName.toUpperCase() === "IMG") {
        this.wrapper.children[index].remove()
      }
    }

    this.wrapper.appendChild(image);
  }

  save(blockContent) {
    const img = blockContent.querySelector('img');
    return {
      url: img && img.src || ""
    }
  }

  static get isReadOnlySupported() {
    return true;
  }
}

export default RichEditorImage



