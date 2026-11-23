let W = 1920, H = 1080, i = 0;
document.body.innerHTML = `<canvas id=C width=${W} height=${H} style=position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;cursor:none>`;
const g = C.getContext('webgl2');
g.getExtension('EXT_color_buffer_float');
g.getExtension('EXT_float_blend');
const p = g.createProgram();
['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', SCENE_SRC].map((c, j) => {
  const h = g.createShader(35633 - j); g.shaderSource(h, c); g.compileShader(h); g.attachShader(p, h);
  if (!g.getShaderParameter(h, 35713)) console.error('SHADER ' + j + ': ' + g.getShaderInfoLog(h)); //DEV
});
g.linkProgram(p); g.useProgram(p);
const t = g.createTexture(), f = g.createFramebuffer(), u = g.getUniformLocation(p, 'F');
g.bindTexture(3553, t); g.texImage2D(3553, 0, 34836, W, H, 0, 6408, 5126, null);
g.texParameteri(3553, 10241, 9728); g.texParameteri(3553, 10240, 9728);
g.bindFramebuffer(36160, f); g.framebufferTexture2D(36160, 36064, 3553, t, 0);
g.viewport(0, 0, W, H); g.clear(16384);
const pass = n => {
  g.bindFramebuffer(36160, n < 0 ? null : f);
  g.bindTexture(3553, n < 0 ? t : null);
  n < 0 ? g.disable(3042) : (g.enable(3042), g.blendFunc(1, 1));
  g.uniform1i(u, n); g.drawArrays(4, 0, 3);
};
window.pass = pass; window.cv = C; window.gl = g; //DEV
const loop = () => i < 192 ? (pass(i++), requestAnimationFrame(loop)) : pass(-1);
if (!window.CAP) //DEV
loop();
onclick = () => C.requestFullscreen();
