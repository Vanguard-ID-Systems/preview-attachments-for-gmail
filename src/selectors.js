// Every dependency on Gmail's DOM lives in this file.
// When Gmail changes its markup, this is the only file that should need updating.
//
// Observed compose chip (Nov 2026, English locale):
//   <div class="dL" aria-label="Attachment: photo.png. Press enter to view the attachment and delete to remove it">
//     <a class="dO" href="https://mail.google.com/mail/u/0/?ui=2&ik=…&view=att&disp=safe&…" target="_blank">
//       <div class="vI">photo.png</div> <div class="vJ">(1,758K)</div>
//     </a>
//     <div role="button" aria-label="Remove attachment" class="vq"></div>
//   </div>
//
// Detection is structural (the download link inside a compose form) so it does not
// depend on the interface language. The aria-label strings are secondary hints only.
export const SEL = {
  // Both the popup compose window and inline replies wrap their fields in this form.
  composeForm: 'form[enctype="multipart/form-data"]',

  // Primary, language-independent signal: the attachment's download link.
  chipLink: 'a[href*="view=att"]',

  // Links inside the message body editor are quoted content, never chips.
  editor: '[contenteditable="true"], [role="textbox"]',

  // Secondary (English-only) signal for the chip container.
  chipLabelled: 'div[aria-label^="Attachment:"]',
  chipAriaPrefix: 'Attachment: ',
  chipAriaSuffix: '. Press enter',

  // Inside the chip: the filename and the size label, e.g. "(1,758K)".
  chipName: '.vI',
  chipSize: '.vJ',

  // Older/other Gmail variants store "<mime>:<filename>:<download url>" in this attribute.
  downloadUrlAttr: 'download_url',

  // Attachment URLs must be same-origin and under this path to be fetched.
  attachmentPath: '/mail/',

  // Marker we add to chips we have already decorated.
  decoratedAttr: 'data-gap-decorated',

  // Class of the preview button we inject into each chip, and the id of its stylesheet.
  buttonClass: 'gap-preview-button',
  styleId: 'gap-preview-style',
};
