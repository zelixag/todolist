const HOST = 'https://106.75.190.202:10086'


export function postData(url, data) {
  // Default options are marked with *
  return fetch(`${HOST}${url}`, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // *client, no-referrer
  })
  .then(response => response.json()) // parses response to JSON
}

export function getData(url) {
  return fetch(`${HOST}${url}`, {
    method: 'GET'
  })
  .then(response => response.json()) 
}