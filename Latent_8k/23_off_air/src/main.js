// The framebuffer and capture interface follow Latent's shared loader.
(async () => {
  let width = 1600, height = 900;
  if (window.CAPW) { width = CAPW; height = CAPH } //DEV
  document.title = 'OFF AIR / LATENT';
  document.body.innerHTML = `<style>body{margin:0;background:#151320}canvas,main{position:fixed;inset:0;width:100%;height:100%;object-fit:contain}main{display:grid;place-items:end center}button{margin:6vh;padding:1em 2em;border:0;background:#f8ebd9;color:#1e1926;font:bold 16px monospace;letter-spacing:.12em;cursor:pointer}button:disabled{cursor:wait}</style><canvas id=C width=${width} height=${height}></canvas><main id=P0><button id=statusLine disabled>TUNING RECEIVER</button></main>`;
  await new Promise(resolve => setTimeout(resolve, 80));
  const gl = C.getContext('webgl2', { antialias: false });
  if (!gl?.getExtension('EXT_color_buffer_float')) {
    statusLine.textContent = 'WEBGL2 GPU REQUIRED';
    return;
  }
  function program(fragment) {
    const pipe = gl.createProgram();
    ['#version 300 es\nvoid main(){gl_Position=vec4(gl_VertexID%2*4-1,gl_VertexID/2*4-1,0,1);}', fragment].forEach((source, index) => {
      const shader = gl.createShader(35633 - index);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(pipe, shader);
    });
    gl.linkProgram(pipe);
    if (!gl.getProgramParameter(pipe, 35714)) {
      throw Error(gl.getAttachedShaders(pipe).map(shader => gl.getShaderInfoLog(shader)).join('\n'));
    }
    return pipe;
  }
  function target(w, h, format) {
    const image = gl.createTexture();
    gl.bindTexture(3553, image);
    gl.texImage2D(3553, 0, format, w, h, 0, 6408, 5126, null);
    gl.texParameteri(3553, 10241, 9729);
    gl.texParameteri(3553, 10242, 33071);
    gl.texParameteri(3553, 10243, 33071);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(36160, framebuffer);
    gl.framebufferTexture2D(36160, 36064, 3553, image, 0);
    return [image, framebuffer];
  }
  const music = program(MUSIC_SRC), scene = program(SCENE_SRC), post = program(POST_SRC);
  const rows = 900, samples = rows * 4096;
  const [sound, soundTarget] = target(4096, rows, 34836);
  gl.viewport(0, 0, 4096, rows);
  gl.useProgram(music);
  gl.drawArrays(4, 0, 3);
  const pcm = new Float32Array(samples * 4);
  gl.readPixels(0, 0, 4096, rows, 6408, 5126, pcm);
  const buffer = new AudioBuffer({ length: samples, numberOfChannels: 2, sampleRate: 48000 });
  for (let ch = 0; ch < 2; ch++) {
    const dst = buffer.getChannelData(ch);
    for (let i = 0; i < samples; i++) dst[i] = pcm[i * 4 + ch];
  }
  gl.deleteTexture(sound);
  gl.deleteFramebuffer(soundTarget);

  gl.activeTexture(33985);
  const type = document.createElement('canvas').getContext('2d');
  type.canvas.width = 512;
  type.canvas.height = 512;
  type.fillStyle = 'white';
  type.textAlign = 'center';
  ['OFF AIR', 'LATENT   /   023', 'VERTICAL HOLD', 'END OF TRANSMISSION', 'GPT-6.2 SOL'].forEach((word, index) => {
    type.font = index ? 'bold 34px monospace' : 'bold 100px Impact';
    type.save();
    type.translate(256, index * 100 + (index ? 63 : 85));
    type.scale(Math.min(1.5, 480 / type.measureText(word).width), 1);
    type.fillText(word, 0, 0);
    type.restore();
  });
  gl.bindTexture(3553, gl.createTexture());
  gl.texImage2D(3553, 0, 6408, 6408, 5121, type.canvas);
  gl.generateMipmap(3553);
  gl.activeTexture(33984);
  const [, framebuffer] = target(width, height, 34842);
  gl.texParameteri(3553, 10241, 9987);
  for (const pipe of [scene, post]) {
    gl.useProgram(pipe);
    gl.uniform1i(gl.getUniformLocation(pipe, 'B'), 1);
  }
  const sceneTime = gl.getUniformLocation(scene, 'R');
  const postTime = gl.getUniformLocation(post, 'R');
  function frame(t) {
    gl.viewport(0, 0, width, height);
    gl.bindFramebuffer(36160, framebuffer);
    gl.useProgram(scene);
    gl.uniform4f(sceneTime, width, height, t, 0);
    gl.drawArrays(4, 0, 3);
    gl.bindFramebuffer(36160, null);
    gl.generateMipmap(3553);
    gl.useProgram(post);
    gl.uniform4f(postTime, width, height, t, 0);
    gl.drawArrays(4, 0, 3);
  }
  frame(0);
  window.audio = buffer; window.fr = frame; window.cv = C; window.gl = gl; window.fbo = framebuffer; //DEV
  if (window.CAP) return; //DEV
  statusLine.textContent = 'CLICK TO PLAY';
  statusLine.disabled = false;
  P0.onclick = async () => {
    P0.onclick = null;
    const context = new AudioContext();
    C.requestFullscreen().catch(() => {});
    await context.resume();
    P0.remove();
    const player = context.createBufferSource();
    player.buffer = buffer;
    player.connect(context.destination);
    const start = context.currentTime;
    player.start(start);
    function tick() {
      const t = context.currentTime - start;
      frame(Math.min(t, 76.8));
      if (t < 76.8) requestAnimationFrame(tick);
    }
    tick();
  };
})();
