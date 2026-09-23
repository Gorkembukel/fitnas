// Küçük JS tokenizer: kaynağı [{code:true|false, text}] parçalarına ayırır.
// code:false → string, template metni, yorum, regex literal. Template içindeki ${...} kod olarak kalır.
export function segments(src) {
  const out = []; let buf = '', isCode = true;
  const flush = (nextCode) => { if (buf) out.push({ code: isCode, text: buf }); buf = ''; isCode = nextCode; };
  const stack = []; // template'e dönüş için: her ${ açıldığında brace derinliği
  let depth = 0, i = 0, lastSig = '';
  const regexOk = () => {
    if (!lastSig) return true;
    if ('(,=:[!&|?{};+-*%<>~^'.includes(lastSig.slice(-1))) return true;
    return /(^|[^\w$])(return|typeof|case|do|else|in|of|void|delete|new)$/.test(lastSig);
  };
  const n = src.length;
  function readTemplate() { // i: '`' sonrası veya '}' sonrası (template içinde)
    while (i < n) {
      const c = src[i];
      if (c === '\\') { buf += src.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { buf += c; i++; flush(true); return 'end'; }
      if (c === '$' && src[i + 1] === '{') { buf += '${'; i += 2; flush(true); stack.push(depth); depth = 0; lastSig = '{'; return 'expr'; }
      buf += c; i++;
    }
    throw new Error('kapanmamış template');
  }
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; flush(false); buf = src.slice(i, end); flush(true); i = end; continue; }
    if (c === '/' && d === '*') { const end = src.indexOf('*/', i + 2) + 2; flush(false); buf = src.slice(i, end); flush(true); i = end; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === '\\') j++; if (src[j] === '\n') throw new Error('satır sonunda kapanmamış string @' + i); j++; }
      flush(false); buf = src.slice(i, j + 1); flush(true); i = j + 1; lastSig = 'str'; continue; }
    if (c === '`') { flush(false); buf = '`'; i++; readTemplate(); lastSig = 'str'; continue; }
    if (c === '/' && regexOk()) { let j = i + 1, cls = false; while (j < n) { const x = src[j]; if (x === '\\') { j += 2; continue; } if (x === '[') cls = true; else if (x === ']') cls = false; else if (x === '/' && !cls) break; else if (x === '\n') throw new Error('regex satır sonu @' + i); j++; }
      j++; while (/[a-z]/i.test(src[j])) j++; flush(false); buf = src.slice(i, j); flush(true); i = j; lastSig = 'rx'; continue; }
    if (c === '{') depth++;
    if (c === '}') { if (depth === 0 && stack.length) { depth = stack.pop(); flush(false); buf = '}'; i++; readTemplate(); lastSig = 'str'; continue; } depth--; }
    buf += c; i++;
    if (!/\s/.test(c)) lastSig = (lastSig + c).slice(-12);
  }
  flush(true);
  if (stack.length) throw new Error('kapanmamış ${');
  return out;
}
export const codeText = src => segments(src).map(s => s.code ? s.text : '""').join('');
export const mapCode = (src, fn) => segments(src).map(s => s.code ? fn(s.text) : s.text).join('');
