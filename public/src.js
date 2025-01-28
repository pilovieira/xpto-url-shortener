const mainPane = document.getElementById("main");
const failPane = document.getElementById("fail");

function putCreateForm(){
  mainPane.innerHTML = `<input id="url" type="text"><button class="link" onclick="create()">Short URL</button>`;
}

function create(){
  failPane.innerHTML = '';

  const url = document.getElementById('url').value;
  if (!url) {
    failPane.innerHTML = `<h1>Invalid URL</h1>`;
    return;
  }

  console.log(`Creating url for: '${url}'`);

  fetch("./", {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({url})
  }).then(function (res){
    if(res.status === 201){
      res.json().then(body => {
        const url = `${location.origin}/${body.key}`;
        console.log(`Url created: '${url}'`);
        mainPane.innerHTML = `<a id="shortUrl" class="showShort" href="${url}">${url}</a><button class="link clip">Copy</button><button class="link" onclick="putCreateForm()">Short another URL</button>`;
        new ClipboardJS('.clip', {target: () => document.querySelector('#shortUrl')});
      });
    } else if(res.status === 400){
      res.json().then(body => {
        failPane.innerHTML = `<h1>${body.fail}</h1>`;
      });
    }
  }).catch(function (e){
    failPane.innerHTML = `<h1>${e.message}</h1>`;
  });
}

putCreateForm();