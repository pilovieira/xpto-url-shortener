const createIndex = (res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});

  res.write(
    '<!DOCTYPE html>' +
    '<html>' +
    '  <head>' +
    '    <meta charset="utf-8">' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1">' +
    '    <title>Xablau Url Shortener</title>' +
    '    <link rel="icon" type="image/png" href="./public/image/favicon.png"/>' +
    '    <link rel="stylesheet" href="./public/css/main.css" />' +
    '  </head>' +
    '  <body>' +
    '    <div id="message">' +
    '      <div id="failPane" class="center"></div>' +
    '      <h1 class="center">XABLAU</h1>' +
    '      <p id="phrase" class="center">url shortener</p>' +
    '      <div id="mainPane"></div>' +
    '      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>' +
    '      <ins class="adsbygoogle"' +
    '           style="display:block"' +
    '           data-ad-client="ca-pub-3459908964898326"' +
    '           data-ad-slot="6048141326"' +
    '           data-ad-format="auto"' +
    '           data-full-width-responsive="true"></ins>' +
    '      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>' +
    '    </div>' +
    '    <script src="./public/js/clipboard.min.js"></script>' +
    '    <script defer src="./public/js/index.js"></script>' +
    '  </body>' +
    '</html>');

  res.end();
}

module.exports = createIndex;