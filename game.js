//load the AMD modules we need
require(['frozen/GameCore', 'frozen/ResourceManager', 'dojo/keys', 'dojo/_base/declare', 'frozen/box2d/Box', 'frozen/box2d/RectangleEntity', 'frozen/box2d/PolygonEntity', 'frozen/box2d/CircleEntity'],
 function(GameCore, ResourceManager, keys, declare, Box, Rectangle, Polygon, Circle){

  //dimensions same as canvas.
  var gameH = 480;
  var gameW = 770;
  
  var speed = 5;

  var nyanStartX = 119;
  var nyanStartY = 57;

  var output = document.getElementById('output');

  var rm = new ResourceManager();
  var backImg = rm.loadImage('images/background.png');
  var nyanImg = rm.loadImage('images/Su-51k out.png');
  var laserImg = rm.loadImage('images/strip_spikey.png');
  var yarnImg = rm.loadImage('images/yarn.png');
  var yipee = rm.loadSound('sounds/yipee.wav');

  var yarnMillis = 0;
  var spawnMillis = 0;

  var box;
  var world = {};
  var yarns = [];

  //pixels per meter for box2d
  var SCALE = 30.0;

  //objects in box2d need an id
  var geomId = 1;

  //shapes in the box2 world, locations are their centers
  var nyan, moon, pyramid, ground, ceiling, leftWall, rightWall, yarn;


  // create our box2d instance
  box = new Box({intervalRate:60, adaptive:false, width:gameW, height:gameH, scale:SCALE, gravityY:0});
  
  //create each of the shapes in the world
  ground = new Rectangle({
    id: geomId,
    x: 385 / SCALE,
    y: 480 / SCALE,
    halfWidth: 1000 / SCALE,
    halfHeight: 40 / SCALE,
    staticBody: true,
    hidden: true
  });
  box.addBody(ground); //add the shape to the box
  world[geomId] = ground; //keep a reference to the shape for fast lookup

  geomId++;
  celing = new Rectangle({
    id: geomId,
    x: 385 / SCALE,
    y: -40 / SCALE,
    halfWidth: 1000 / SCALE,
    halfHeight: 40 / SCALE,
    staticBody: true
  });
  box.addBody(celing);
  world[geomId] = celing;

  geomId++;
  leftWall = new Rectangle({
    id: geomId,
    x: -80 / SCALE,
    y: 240 / SCALE,
    halfWidth: 40 / SCALE,
    halfHeight: 1000 / SCALE,
    staticBody: true
  });
  box.addBody(leftWall);
  world[geomId] = leftWall;

  rightWall = new Rectangle({
    id: geomId,
    x: 850 / SCALE,
    y: 240 / SCALE,
    halfWidth: 40 / SCALE,
    halfHeight: 1000 / SCALE,
    staticBody: true
  });
  box.addBody(rightWall);
  world[geomId] = rightWall;

  geomId++;
  /*moon = new Circle({
    id: geomId,
    x: 626 / SCALE,
    y: 120 / SCALE,
    radius: 63 / SCALE,
    staticBody: true,
    hidden: true
  });
  box.addBody(moon);
  world[geomId] = moon;

  geomId++;
  pyramid = new Polygon({
    id: geomId,
    points: [{x: 320 / SCALE, y: 440 / SCALE}, {x: 446 / SCALE, y: 290 / SCALE}, {x: 565 / SCALE, y: 440 / SCALE}],
    staticBody: true,
    hidden: true
  });
  box.addBody(pyramid);
  world[geomId] = pyramid;

  geomId++;*/
  nyan = new Rectangle({
    id: geomId,
    x: nyanStartX / SCALE,
    y: nyanStartY / SCALE,
    halfWidth: 40 / SCALE,
    halfHeight: 54 / SCALE,
    staticBody: false,
    clamp: function(){
    	if (nyan.x >= gameW/SCALE-(41 / SCALE)){nyan.x = 0+(42/SCALE);}
    	if (nyan.x <= 0+(41 / SCALE)){nyan.x = gameW/SCALE-(42/SCALE);}
    },
    draw: function(ctx, scale){ // we want to render the nyan cat with an image
      ctx.save();
      ctx.translate(this.x * scale, this.y * scale);

      ctx.rotate(this.angle); // this angle was given to us by box2d's calculations
      ctx.translate(-(this.x) * scale, -(this.y) * scale);
      ctx.fillStyle = this.color;
      ctx.drawImage(
        nyanImg,
        (this.x-this.halfWidth) * scale - 10, //lets offset it a little to the left
        (this.y-this.halfHeight) * scale
      );
      ctx.restore();
    }
  });
  box.addBody(nyan);
  world[geomId] = nyan;



  //setup a GameCore instance
  var game = new GameCore({
    canvasId: 'canvas',
    resourceManager: rm,
    initInput: function(im){
      //tells the input manager to listen for key events
      im.addKeyAction(keys.LEFT_ARROW);
      im.addKeyAction(keys.RIGHT_ARROW);
      im.addKeyAction(keys.UP_ARROW);
      im.addKeyAction(keys.DOWN_ARROW);

      //the extra param says to only detect inital press
      im.addKeyAction(keys.SPACE, true);
    },
    handleInput: function(im){
      if(im.keyActions[keys.LEFT_ARROW].isPressed()){
      	box.bodiesMap[nyan.id].ApplyTorque(-10);
        //box.applyImpulse(nyan.id, 180, speed);
      }

      if(im.keyActions[keys.RIGHT_ARROW].isPressed()){
      box.bodiesMap[nyan.id].ApplyTorque(10);
      //box.applyImpulse(nyan.id, 0, speed);
      }

      if(im.keyActions[keys.UP_ARROW].isPressed()){
        
        box.applyImpulse(nyan.id, nyan.angle*57.2957795+270, speed/2);
      }

      if(im.keyActions[keys.DOWN_ARROW].isPressed()){
        box.applyImpulse(nyan.id, 90, speed);
      }

      //.play sounds with the space bar !
      if(im.keyActions[keys.SPACE].getAmount()){
        //rm.playSound(yipee);
        fire();
      }

      //when creating geometry, you may want to use the to determine where you are on the canvas
      //if(im.mouseAction.position){
        //output.innerHTML = 'x: ' + im.mouseAction.position.x + ' y: ' + im.mouseAction.position.y;
      //}
    },
    update: function(millis){
      yarnMillis += millis;
      if(yarnMillis > 2000){
        yarnMillis = 0;
        var yarndirection = Math.floor((Math.random()*359)+1);

        for (var yarn in yarns) {
          console.log(yarns[yarn]);
          box.applyImpulse(yarns[yarn].id, yarndirection, speed*5);
        }
      }
      spawnMillis += millis;
      if(spawnMillis > 5000){
        spawnMillis = 0;

        geomId++;
        var thisYarn = new Circle({
          id: geomId,
          x: 600 / SCALE,
          y: 390 / SCALE,
          radius: 30 / SCALE,
          staticBody: false,
          density: 0.5,  // al little lighter
          restitution: 0.8, // a little bouncier
          draw: function(ctx, scale){  //we also want to render the yarn with an image
            ctx.save();
            ctx.translate(this.x * scale, this.y * scale);
            ctx.rotate(this.angle);
            ctx.translate(-(this.x) * scale, -(this.y) * scale);
            ctx.fillStyle = this.color;
            ctx.drawImage(
              yarnImg,
              (this.x-this.radius) * scale,
              (this.y-this.radius) * scale
            );
            ctx.restore();
          }
        });
        box.addBody(thisYarn);
        world[geomId] = thisYarn;
        yarns.push(thisYarn);
      }


      //have box2d do an interation
      box.update();

      //update the dyanmic shapes with box2d calculations
      var bodiesState = box.getState();
      for (var id in bodiesState) {
        var entity = world[id];
        if (entity && !entity.staticBody){
          entity.update(bodiesState[id]);
        }
      }

    },
    draw: function(context){
      context.drawImage(backImg, 0, 0, this.width, this.height);
      //ground.draw(context, SCALE);
      //moon.draw(context, SCALE);
      //pyramid.draw(context, SCALE);

      for (var entity in world) {
        if(!world[entity].hidden){
          world[entity].draw(context, SCALE);
        }
      }
    }
  });
  var i =0;
  var bullets = [];
  function fire(){
  		geomId++;
        var bullet = new Circle({
          id: geomId,
          x: nyan.x+(16/SCALE)*Math.sin((nyan.angle+270)/360*2*Math.PI)*nyan.halfWidth,
          y: nyan.y+(16/SCALE)*Math.cos((nyan.angle+270)/360*2*Math.PI)*nyan.halfHeight,
          radius: 16 / SCALE,
          staticBody: false,
          density: 1,  // al little lighter
          restitution: 0.0, // a little bouncier
          i: 0,
          draw: function(ctx, scale){  //we also want to render the yarn with an image
            
            ctx.save();
            ctx.translate(this.x * scale, this.y * scale);
            ctx.rotate(this.angle);
            ctx.translate(-(this.x) * scale, -(this.y) * scale);
            ctx.fillStyle = this.color;
            var framesize = 32;
            ctx.drawImage(laserImg,
            	16+framesize*i,
            	16, 
            	framesize, 
            	framesize, 
            	(this.x-this.radius) * scale,
              (this.y-this.radius) * scale, 
              framesize, 
              framesize);
            /*ctx.drawImage(
              laserImg,
              (this.x-this.radius) * scale,
              (this.y-this.radius) * scale
            );*/
            ctx.restore();
            this.i++;
            if (this.i==16){this.i==0;}
          } 
        });
        box.addBody(bullet);
        world[geomId] = bullet;
        box.applyImpulse(geomId, nyan.angle*57.2957795+270, speed/2);
        bullets.push(bullet);
      }
  //if you want to take a look at the game object in dev tools
  console.log(game);

  //launch the game!
  game.run();
});