function putCreateForm() {
  const innerHtml = `<input id="url" type="text"><button class="link" onclick="createShortUrl()">Short URL</button>`;
  document.getElementById("mainPane").innerHTML = innerHtml;
}

function createShortUrl() {
  clearError();

  const url = document.getElementById('url').value;

  console.log(`Creating url for: '${url}'`);

  fetch('./create', {
    method: 'post',
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({url})
  }).then(function (data) {
    if (data.status == 201) {
      data.json().then(body => {
        showShortUrl(body.hash);
      });
    } else if (data.status = 400) {
      data.json().then(body => {
        showError(body.fail);
      });
    }
  }).catch(function (e) {
    showError(e.message);
  });
}

function showShortUrl(hash) {
  const shortUrl = `${location.origin}/${hash}`;

  console.log(`Url created: '${shortUrl}'`);

  document.getElementById("mainPane").innerHTML =
    `<a id="shortUrl" class="showShort" href="${shortUrl}">${shortUrl}</a>
    <button class="link clip">Copy</button>
    <button class="link" onclick="putCreateForm()">Short another URL</button>`;

  new ClipboardJS('.clip', { target: () => document.querySelector('#shortUrl') } );
}

function showError(message) {
  document.getElementById("failPane").innerHTML = `<h1>${message}</h1>`;
}

function clearError() {
  document.getElementById("failPane").innerHTML = '';
}

putCreateForm();