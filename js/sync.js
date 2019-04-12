let room='frkt';
let volume = new Tone.Volume(-12).toMaster();

let Sync = {
  notes:['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'],
  b:new Bugout(room,{seed:localStorage.seed}),
  pub(type,data) {
    this.b.send({
      type:type,
      data:data
    })
  },
  send(ID,type,data) {
    this.b.send(ID,{
      type:type,
      data:data
    })
  },
  synth: new Tone.AMSynth({
      harmonicity : 3 ,
      detune : 0 ,
      oscillator : {
        type : 'sine'
      },
      envelope : {
        attack : 0.03 ,
        decay : 0.01 ,
        sustain : 1 ,
        release : 0.7
      },
      modulation : {
        type : 'square'
      },
      modulationEnvelope : {
        attack : 0.5 ,
        decay : 0 ,
        sustain : 1 ,
        release : 0.9
      }
    }).connect(volume),
  webAudioTouchUnlock (context) {
    if (context.state === 'suspended' && 'ontouchstart' in window)
    {
        var unlock = function()
        {
            context.resume().then(function()
            {
                document.body.removeEventListener('touchstart', unlock);
                document.body.removeEventListener('touchend', unlock);
            });
        };
        document.body.addEventListener('touchstart', unlock, false);
        document.body.addEventListener('touchend', unlock, false);
    }
},
  colorHash  (inputString) {
  var sum = 0;
  for(var i in inputString){
    sum += inputString.charCodeAt(i);
  }
  r = ~~(('0.'+Math.sin(sum+1).toString().substr(6))*256);
  g = ~~(('0.'+Math.sin(sum+2).toString().substr(6))*256);
  b = ~~(('0.'+Math.sin(sum+3).toString().substr(6))*256);
  var rgb = "rgb("+r+", "+g+", "+b+")";
  var hex = "#";
  hex += ("00" + r.toString(16)).substr(-2,2).toUpperCase();
  hex += ("00" + g.toString(16)).substr(-2,2).toUpperCase();
  hex += ("00" + b.toString(16)).substr(-2,2).toUpperCase();
  return {
     r: r, g: g, b: b, rgb: rgb, hex: hex
  };
},
  noteColor(pitch) {
    return 'hsl('+pitch*30+',100%,42%)'
  },
  playNote(pitch=440) {
    this.synth.triggerAttackRelease(this.calcFrequency(pitch), '16n');
  },
  calcFrequency(pitch, octave=4) {
      return Number(440 * Math.pow(2, octave - 4 + pitch / 12));
  },
  hslToRgb(h, s=1, l=0.9)  {
    var r, g, b;
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [ r * 255, g * 255, b * 255, 255 ];
  },
  getAvatar(ID,pitch=0) {
      let color = Sync.colorHash(ID);
      return new Identicon(ID, {  // https://github.com/stewartlord/identicon.js
        size:60,
        foreground:[color.r,color.g,color.b,255],
        background: Sync.hslToRgb(pitch/12),
        format:'svg'
      }).toString();
    },
  getQR() {
    let svg = document.getElementById('qrcode-svg')
    let QRC = qrcodegen.QrCode;
    let qr0 = QRC.encodeText(window.location.href, QRC.Ecc.MEDIUM);
    let qrcode = qr0.toSvgString(4);
    svg.setAttribute("viewBox", / viewBox="([^"]*)"/.exec(qrcode)[1]);
    svg.querySelector("path").setAttribute("d", / d="([^"]*)"/.exec(qrcode)[1]);
    return qrcode
  }
};

localStorage.seed=Sync.b.seed
