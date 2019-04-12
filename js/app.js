

const app = new Vue({
  el:'#app',
  data: {
    me: {
      seed: localStorage.seed,
      ID:Sync.b.address(),
      color:Sync.colorHash(Sync.b.address()),
      avatar:Sync.getAvatar(Sync.b.address(),localStorage.note),
      name:localStorage.name,
      note:localStorage.note || 0
    },
    url:window.location.href,
    name:localStorage.name,
    messageText:'',
    notes:Sync.notes,
    b:Sync.b,
    synth: Sync.synth,
    peers:{},
    users:[],
    chat:[],
    chatSize:5,
    connected:false,
    connections:0,
    qrcode: '',
    tabs: {
      top:0,
      bottom:0,
      qr:false
    },
    fresh:0,
    actions: {
      note(peer,data) {
        peer.note=data;
        peer.avatar=Sync.getAvatar(peer.ID,data);
        this.fresh++;
        app.playNote(data)
      },
      name(peer, data) {
        peer.name=data;
      },
      message(peer, data) {
        peer.said=data
        if (app.chat.length>=app.chatSize) {
          console.log(app.chat.pop())
        }
        app.chat.unshift({
          ID:peer.ID,
          sender:peer.name,
          data:data
        })
      },
      coords(peer,data) {
        peer.coords=data
      }
    }
  },
  created() {
    let b = Sync.b;
    let me = this.me;
    this.addPeer(this.me.ID)

    b.on("message", (ID, message) => {
      let peer = this.peers[ID]
      if(peer) {
        let action = this.actions[message.type];
        if(action) {
          action(peer,message.data)
        }
      }
    });

    b.on("connections", (c) => {
      if (c == 0 && this.connected == false) {
        this.connected = true;
        console.log("ready");
      }
      this.connections=c;
    });
    b.on("seen", (ID) => {
      console.log(ID)
      this.addPeer(ID)
      if(me.name) {
        Sync.pub('name',me.name)
      }
      if(me.note) {
        Sync.pub('note',me.note)
      }
    });
    b.on("rpc", function(a) {
     console.log("rpc:", a);
    });
    b.on('left', (ID) => {
      console.log('left '+ ID)
      this.removePeer(ID)
    })
    b.on('timeout', (ID) => {
      console.log('timeout '+ ID)
      this.removePeer(ID)
    })
    window.onbeforeunload = (event) => {
      b.close();
    };

//    window.addEventListener('mousemove', this.onMove);

  },
  mounted() {
    Sync.webAudioTouchUnlock(Tone.context);
    this.qr=Sync.getQR();
  },
  computed: {
    myColor() {
      return Sync.noteColor(this.note)
    },
    myAvatar() {
      return Sync.getAvatar(this.me.ID,this.me.note)
    }
  },
  methods: {
    colorHash: Sync.colorHash,
    noteColor: Sync.noteColor,
    getAvatar: Sync.getAvatar,
    getNotePeers(note) {
      let list =[];
      for(let ID in this.peers) {
        if(this.peers[ID].note==note) {
          list.push(this.peers[ID])
        }
      }
      return list
    },
    setName() {
      this.me.name=this.name;
      localStorage.name=this.name;
      Sync.pub('name',this.name)
    },
    setNote(pitch) {
      this.me.note=pitch;
      localStorage.note=pitch;
      this.me.avatar=Sync.getAvatar(Sync.b.address(),pitch)
      Sync.playNote(pitch);
      this.fresh++;
      Sync.pub('note',pitch);
    },
    playNote(pitch,out) {
      if(out) {
        let peers = this.getNotePeers(pitch);
        if(peers.length>0) {
          peers.forEach((peer) => {
            if (peer.ID!=this.me.ID) {
              Sync.send(peer.ID,'note', pitch)
            } else {
              Sync.playNote(pitch)
            }
          })
        } else {
          Sync.playNote(pitch)
        }
      } else {
        Sync.playNote(pitch)
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
    addPeer(ID) {
      this.peers[ID] = {
        ID:ID,
        name:'',
        note:0,
        avatar:Sync.getAvatar(ID),
        said:'',
        coords:{
          x:0,
          y:0
        }
      };
      this.fresh++;
      console.log(this.peers)
    },
    removePeer(ID) {
      if(this.peers[ID]) {
        delete this.peers[ID]
      }
    },
    say(text = this.messageText){
      this.messageText='';
      Sync.pub('message',text)
    }
  }
})




  // instantiate our bugout instance



  /*** logging ***/

  // log when network connectivity changes
  var connected = false;
