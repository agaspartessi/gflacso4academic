window.onload = function() {
  let frameElement = document.getElementById("instagram-embed-3");
  let doc = frameElement.contentDocument;
  doc.body.innerHTML = doc.body.innerHTML + '<style>.Header {display:none!important;}</style>';
}