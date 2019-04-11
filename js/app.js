let room='frkt';
let notes = [
  {
    name: "A",
    pitch: 0,
    color: "#FE130C"
  },
  {
    name: "A#",
    pitch: 1,
    color: "#FF8000"
  },
  {
    name: "B",
    pitch: 2,
    color: "#fadc00"
  },
  {
    name: "C",
    pitch: 3,
    color: "#7AC11D"
  },
  {
    name: "C#",
    pitch: 4,
    color: "#5BB224"
  },
  {
    name: "D",
    pitch: 5,
    color: "#41AF7F"
  },
  {
    name: "D#",
    pitch: 6,
    color: "#6EC7C1"
  },
  {
    name: "E",
    pitch: 7,
    color: "#3A59A6"
  },
  {
    name: "F",
    pitch: 8,
    color: "#202C90"
  },
  {
    name: "F#",
    pitch: 9,
    color: "#4F268E"
  },
  {
    name: "G",
    pitch: 10,
    color: "#963396"
  },
  {
    name: "G#",
    pitch: 11,
    color: "#F2187E"
  }
];

function webAudioTouchUnlock (context)
{
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
}

webAudioTouchUnlock(Tone.context);

Tone.calcFrequency = function(pitch, octave=3) {
      return Number(440 * Math.pow(2, octave - 4 + pitch / 12));
};

document.querySelector('.note-btn').addEventListener('click', () => Tone.start())

let synth = new Tone.Synth().toMaster()

const app = new Vue({
  el:'#app',
  data: {
    url:window.location.href,
    seed: localStorage.seed,
    address:'',
    avatar:'',
    myName:'',
    name:'',
    messageText:'',
    room:room,
    notes:notes,
    b:new Bugout(room,{seed:localStorage.seed}),
    synth: synth,
    users:[],
    chat:[],
    chatSize:5,
    connected:false,
    connections:0,
    qrcode: '',
    open: {
      qr:false
    }
  },
  created() {
    let b = this.b;
    localStorage.seed=b.seed;
    this.address=b.address();
    this.addUser(this.address)
    let color=this.colorHash(this.address);

    this.avatar=this.getAvatar(this.address);

    b.on("message", (address, message) => {
      this.userSaid(address,message)
    });

    b.on("connections", (c) => {
      if (c == 0 && this.connected == false) {
        this.connected = true;
        console.log("ready");

        // link to the messageboard client URL
    //    var clientURL = document.location.href.replace("server.html", "") + "#" + b.address();
      }
      this.connections=c;
    });

    // log when a client makes an rpc call
    b.on("rpc", function(address, call, args) {
     console.log("rpc:", address, call, args);
    });

    // log when we see a new client address
    b.on("seen", (address) => {
      this.addUser(address)
    });

    window.onbeforeunload = (event) => {
      b.close();
    };

    b.on('left', (address) => {
      console.log('left '+ address)
      this.removeUser(address)
    })

    b.on('timeout', (address) => {
      console.log('timeout '+ address)
      this.removeUser(address)
    })

//    window.addEventListener('mousemove', this.onMove);

    b.register("setCoords", (ID, args, cb) => {
      let user = this.users.findIndex(ID);
      Object.assign(this.users[user], {
          x:args.x,
          y:args.y
        })
      console.log(pk + ' moved')
    }, "Respond to ping with 'pong'.");



  },
  mounted() {
    let svg = document.getElementById('qrcode-svg')
    let QRC = qrcodegen.QrCode;
    let qr0 = QRC.encodeText(this.url, QRC.Ecc.MEDIUM);
    this.qrcode = qr0.toSvgString(4);
    svg.setAttribute("viewBox", / viewBox="([^"]*)"/.exec(this.qrcode)[1]);
    svg.querySelector("path").setAttribute("d", / d="([^"]*)"/.exec(this.qrcode)[1]);

  },
  methods: {
    setName() {
      this.myName=this.name;
      this.b.send({
        type:'name',
        name: this.name
      })
    },
    playNote(pitch,out) {
      let note = Tone.calcFrequency(pitch)
      this.synth.triggerAttackRelease(note, '8n')
      if(out) {
        this.b.send({
          type:'note',
          note:pitch
        })
      }
    },
    onMove(ev) {
      this.b.send({
        type:'coords',
        coords: {
          x:ev.clientX,
          y:ev.clientY
        }
        })
    },
    getAvatar(ID) {
      let color = this.colorHash(ID);
      return new Identicon(ID, {
        size:60,
        foreground:[color.r,color.g,color.b,255],
        format:'svg'
      }).toString();
    },
    addUser(ID) {
      let user ={
        ID:ID,
        name:'',
        said:'',
        coords:{
          x:0,
          y:0
        }
      };
      user.avatar=this.getAvatar(ID);
      this.users.push(user);
    },
    removeUser(ID) {
      let user = this.users.findIndex((user) => {
        user.ID==ID
      })
      this.users.splice(user,1);
    },
    say(text = this.messageText){
      this.messageText='';
      this.b.send({
        type:'message',
        text: text
      })
    },
    userSaid(who,what) {
      let user = this.users.findIndex(user => user.ID==who);
      if(this.users[user]) {
        if(!this.users[user].said) {
          this.users[user].said=''
        }
        if(what.type=='note') {
          console.log(what)
          this.playNote(what.note)
        }
        if(what.type=='name') {
          this.users[user].name=what.name;
        }
        if(what.type=='coords' && what.coords) {
          this.users[user].coords=what.coords
        }
        if(what.type=='message') {
          this.users[user].said=what.text
          if (this.chat.length>=this.chatSize) {
            console.log(this.chat.pop())
          }
          this.chat.unshift({
            who:who,
            what:what.text
          })

        }

      }
    },
    colorHash(inputString) {
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
         r: r
        ,g: g
        ,b: b
        ,rgb: rgb
        ,hex: hex
      };
    }
  }
})




  // instantiate our bugout instance



  /*** logging ***/

  // log when network connectivity changes
  var connected = false;
