function splitDialogues(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const documents = xmlDoc.getElementsByTagName('document');

  const dialogues = [];

  for (let i = 0; i < documents.length; i++) {
    const content = documents[i].getElementsByTagName('document_content')[0].textContent;
    const lines = content.split(/\s*__eou__\s*/);

    for (let j = 0; j < lines.length; j++) {
      const dialogue = lines[j].trim();
      if (dialogue !== '') {
        dialogues.push(dialogue);
      }
    }
  }

  return dialogues;
}

// 使用示例
const xmlString = `
<documents>
  <document>
    <document_content>
      Hello, how are you? __eou__ I'm doing well, thanks for asking. How about you? __eou__ I'm great, thanks! __eou__
    </document_content>
  </document>
  <document>
    <document_content>
      What's your favorite color? __eou__ I love blue, it's so calming. What about you? __eou__ I prefer green, it reminds me of nature. __eou__
    </document_content>
  </document>
</documents>
`;

const dialogueArray = splitDialogues(xmlString);
console.log(dialogueArray);