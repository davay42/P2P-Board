const app = new Vue({
  el:'#app',
  data: {
    seed: localStorage.seed,
    address:'',
    avatar:'',
    messageText:'',
    b:new Bugout('frkt',{seed:localStorage.seed}),
    users:[],
    connected:false,
    connections:0
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

    window.addEventListener('mousemove', this.onMove);

    b.register("setCoords", (ID, args, cb) => {
      let user = this.users.findIndex(ID);
      Object.assign(this.users[user], {
          x:args.x,
          y:args.y
        })
      console.log(pk + ' moved')
    }, "Respond to ping with 'pong'.");

  },
  methods: {
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
        said:[],
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
    say(text){
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
          this.users[user].said=[]
        }
        if(what.type=='coords' && what.coords) {
          this.users[user].coords=what.coords
        }
        if(what.type=='message') {
          this.users[user].said.push(what.text)
          setTimeout(
            () => { this.users[user].said.shift() },
            5000
          )
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
