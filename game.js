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
  var nyanImg = rm.loadImage('images/nyan.png');
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
  var B2Vec2 = Box2D.Common.Math.b2Vec2;

  // create our box2d instance
  box = new Box({intervalRate:60, adaptive:false, width:gameW, height:gameH, scale:SCALE, gravityY:0, resolveCollisions: true,
    postSolve: function(idA, idB, impulse){
      if(idA == nyan.id || idB == nyan.id){
        rm.playSound(yipee);
      }
    }});

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
/*
  geomId++;
  moon = new Circle({
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
*/
  geomId++;
  createNyan(geomId, 119, 48, 0);

  function createNyan(id,xcoord,ycoord,angle){
    nyan = new Rectangle({
      id: id,
      x: xcoord / SCALE,
      y: ycoord / SCALE,
      halfWidth: 40 / SCALE,
      halfHeight: 28 / SCALE,
      staticBody: false,
      angle: angle,
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
    world[id] = nyan;
  }

  function resetNyan(myThingId,x,y,angle,vector,speed){
    box.removeBody(myThingId);
    delete world[myThingId];
    createNyan(myThingId, x, y, angle);

    var body = box.bodiesMap[myThingId];
    body.ApplyForce(
      new B2Vec2(speed.x, speed.y,
      body.GetWorldCenter()
    ));
  }

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
        box.applyImpulse(nyan.id, 180, speed);
      }

      if(im.keyActions[keys.RIGHT_ARROW].isPressed()){
        box.applyImpulse(nyan.id, 0, speed);
      }

      if(im.keyActions[keys.UP_ARROW].isPressed()){
        box.applyImpulse(nyan.id, 270, speed);
      }

      if(im.keyActions[keys.DOWN_ARROW].isPressed()){
        box.applyImpulse(nyan.id, 90, speed);
      }

      //.play sounds with the space bar !
      if(im.keyActions[keys.SPACE].getAmount()){
        var thisYarn = yarns.pop().id;
        box.removeBody(thisYarn);
        delete world[thisYarn];
      }
/*
      if(nyan.x > gameW/SCALE){
        resetNyan(nyan.id,0,nyan.y*SCALE,nyan.angle,nyan.angularVelocity,nyan.linearVelocity);
      }
      if(nyan.y > gameH/SCALE){
        resetNyan(nyan.id,nyan.x*SCALE,0,nyan.angle,nyan.angularVelocity,nyan.linearVelocity);
      }
      if(nyan.x < 0){
        console.log(gameW/SCALE);
        resetNyan(nyan.id,gameW,nyan.y*SCALE,nyan.angle,nyan.angularVelocity,nyan.linearVelocity);
      }
      if(nyan.y < 0){
        console.log(gameH/SCALE);
        resetNyan(nyan.id,nyan.x*SCALE,gameH,nyan.angle,nyan.angularVelocity,nyan.linearVelocity);
      }

      console.log(nyan.angularVelocity+","+nyan.linearVelocity);*/

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
      if(spawnMillis > 500){
        spawnMillis = 0;

        geomId++;
        var thisYarn = new Circle({
          id: geomId,
          x: 600 / SCALE,
          y: 390 / SCALE,
          radius: 30 / SCALE,
          staticBody: false,
          density: 0.001,  // al little lighter
          restitution: 0.001, // a little bouncier
          friction: 0.001,
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
      //nyan.draw(context, SCALE);
      //yarn.draw(context, SCALE);
      
      for (var entity in world) {
        if(!world[entity].hidden){
          world[entity].draw(context, SCALE);
        }
      }
      
    }
  });

  //if you want to take a look at the game object in dev tools
  console.log(game);

  //launch the game!
  game.run();
});