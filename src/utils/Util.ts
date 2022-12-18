export function parseDataUri(dataUri: string) {
  return {
    mimeType: normalizeMimeType(parseMimeType(dataUri)),
    data: dataUriToBuffer(dataUri)
  };
}
export function isImage(url: string) {
  if (!url) return false;
  return(url.match(/\.(gif)$/) !== null);
}

function dataUriToBuffer(uri: string) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, '');
  const firstComma = uri.indexOf(',');
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError('malformed data: URI');
  }
  const meta = uri.substring(5, firstComma).split(';');
  let charset = '';
  let base64 = false;
  const type = meta[0] || 'text/plain';
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === 'base64') {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf('charset=') === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ';charset=US-ASCII';
    charset = 'US-ASCII';
  }
  const encoding = base64 ? 'base64' : 'ascii';
  const data = unescape(uri.substring(firstComma + 1));
  const buffer: any = Buffer.from(data, encoding); // eslint-disable-line @typescript-eslint/no-explicit-any
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;

  return buffer;
}

function parseMimeType(uri: string) {
  return uri.substring(5, uri.indexOf(';'));
}

const prefix = /^(\w+\/)+/;
function normalizeMimeType(mime: string) {
  mime = mime.toLowerCase();
  let once = mime.match(prefix).toString();
  if (!once || !(once = once[1])) {
    return mime;
  }
  return mime.replace(prefix, once.toString());
}