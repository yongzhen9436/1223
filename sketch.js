let player1, player2;
let sprite1Img, sprite2Img;
let bgImg;
let bullets = [];
let particles = [];

function preload() {
  // 載入所有圖片
  sprite1Img = loadImage('1all.png');
  sprite2Img = loadImage('2all.png');
  bgImg = loadImage('3.png');
}

function setup() {
  // 直接設定為全螢幕
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  player1 = new Player(100, height/2, '#FF4444', sprite1Img, 65, 68, 87, 83, 70);
  player2 = new Player(width-100, height/2, '#4444FF', sprite2Img, LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 191);
}

// 當視窗大小改變時調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // 只保留射擊控制
  if (keyCode === player1.shootKey) {
    player1.shoot();
  }
  if (keyCode === player2.shootKey) {
    player2.shoot();
  }
}

function draw() {
  // 固定背景，縮放以填滿螢幕
  if (bgImg) {
    let bgRatio = bgImg.width / bgImg.height;
    let screenRatio = width / height;
    
    if (screenRatio > bgRatio) {
      // 如果螢幕比較寬，以寬度為基準
      image(bgImg, width/2, height/2, width, width/bgRatio);
    } else {
      // 如果螢幕比較高，以高度為基準
      image(bgImg, width/2, height/2, height*bgRatio, height);
    }
  }
  
  // 更新和顯示粒子
  updateParticles();
  
  // 更新和顯示玩家
  player1.update();
  player1.display();
  player2.update();
  player2.display();

  // 更新和顯示子彈
  updateBullets();

  // 顯示生命值和能量條
  displayHealthAndEnergy();

  // 顯示操作說明
  displayInstructions();
}

function displayInstructions() {
  push();
  fill(255);
  textSize(max(12, windowWidth/80));
  textAlign(LEFT, BOTTOM);
  text('玩家1：WASD移動，F射擊\n玩家2：方向鍵移動，/射擊', 10, height - 10);
  pop();
}

class Player {
  constructor(x, y, color, spriteImg, leftKey, rightKey, upKey, downKey, shootKey) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.spriteImg = spriteImg;
    this.size = min(windowWidth/12, windowHeight/6);  // 根據視窗大小調整精靈大小
    this.speed = 5;
    this.health = 100;
    this.energy = 100;
    this.leftKey = leftKey;
    this.rightKey = rightKey;
    this.upKey = upKey;
    this.downKey = downKey;
    this.shootKey = shootKey;
    this.direction = 1;
    this.isMoving = false;
    this.lastShot = 0;
    this.shootDelay = 250;
    
    // 精靈動畫設定
    this.currentFrame = 0;
    this.frameCount = 3;
    this.frameWidth = 32;  // 原始精靈圖片中每幀的寬度
    this.frameHeight = 32; // 原始精靈圖片中每幀的高度
    this.animationSpeed = 100;
    this.lastFrameUpdate = 0;
  }

  update() {
    this.isMoving = false;
    if (keyIsDown(this.leftKey)) {
      this.x -= this.speed;
      this.direction = -1;
      this.isMoving = true;
    }
    if (keyIsDown(this.rightKey)) {
      this.x += this.speed;
      this.direction = 1;
      this.isMoving = true;
    }
    if (keyIsDown(this.upKey)) {
      this.y -= this.speed;
      this.isMoving = true;
    }
    if (keyIsDown(this.downKey)) {
      this.y += this.speed;
      this.isMoving = true;
    }
    
    this.x = constrain(this.x, 0, width - this.size);
    this.y = constrain(this.y, 0, height - this.size);

    if (this.energy < 100) {
      this.energy += 0.2;
    }

    if (this.isMoving && frameCount % 3 === 0) {
      this.createMovementParticles();
    }
  }

  display() {
    push();
    translate(this.x + this.size/2, this.y + this.size/2);
    scale(this.direction, 1);

    if (this.spriteImg) {
      let sourceX = this.currentFrame * this.frameWidth;
      image(this.spriteImg, 
            0, 0,                    // 目標位置（因為使用了translate，所以是相對於中心點）
            this.size, this.size,    // 目標大小
            sourceX, 0,              // 來源位置
            this.frameWidth, this.frameHeight  // 來源大小
      );

      if (this.isMoving && millis() - this.lastFrameUpdate > this.animationSpeed) {
        this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        this.lastFrameUpdate = millis();
      }
    }
    pop();
  }

  createMovementParticles() {
    particles.push(new Particle(this.x + this.size/2, this.y + this.size/2, this.color));
  }

  shoot() {
    let currentTime = millis();
    if (currentTime - this.lastShot >= this.shootDelay && this.energy >= 10) {
      let bulletX = this.x + (this.direction === 1 ? this.size : 0);
      bullets.push(new Bullet(bulletX, this.y + this.size/2, this.color, this.direction));
      this.lastShot = currentTime;
      this.energy -= 10;
      
      for(let i = 0; i < 5; i++) {
        particles.push(new Particle(bulletX, this.y + this.size/2, this.color, true));
      }
    }
  }
}

class Bullet {
  constructor(x, y, color, direction) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = 12;
    this.size = 8;
    this.direction = direction;
  }

  update() {
    this.x += this.speed * this.direction;
    if (frameCount % 2 === 0) {
      particles.push(new Particle(this.x, this.y, this.color));
    }
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  checkHit(player) {
    if (this.color === player.color) return false;
    
    if (this.x > player.x && 
        this.x < player.x + player.size &&
        this.y > player.y && 
        this.y < player.y + player.size) {
      player.health -= 10;
      for(let i = 0; i < 10; i++) {
        particles.push(new Particle(this.x, this.y, player.color, true));
      }
      return true;
    }
    return false;
  }

  isOffscreen() {
    return this.x < 0 || this.x > width;
  }
}

class Particle {
  constructor(x, y, color, isExplosion = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 255;
    this.size = random(2, 6);
    this.speedX = isExplosion ? random(-3, 3) : random(-1, 1);
    this.speedY = isExplosion ? random(-3, 3) : random(-1, 1);
    this.life = 255;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 10;
    this.alpha = this.life;
  }

  display() {
    let c = color(this.color);
    c.setAlpha(this.alpha);
    fill(c);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

function updateParticles() {
  for(let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if(particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();
    
    if (bullets[i].checkHit(player1) || bullets[i].checkHit(player2)) {
      bullets.splice(i, 1);
      continue;
    }
    
    if (bullets[i].isOffscreen()) {
      bullets.splice(i, 1);
    }
  }
}

function setGradientBackground(c1, c2) {
  for(let y = 0; y < height; y++){
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawGrid() {
  stroke(255, 255, 255, 20);
  for(let i = 0; i < width; i += 30) {
    line(i, 0, i, height);
  }
  for(let i = 0; i < height; i += 30) {
    line(0, i, width, i);
  }
}

function displayHealthAndEnergy() {
  drawBar(10, 20, player1.health, 100, '#FF4444', 'HP');
  drawBar(10, 40, player1.energy, 100, '#44FF44', 'EP');
  
  drawBar(width - 210, 20, player2.health, 100, '#4444FF', 'HP');
  drawBar(width - 210, 40, player2.energy, 100, '#44FF44', 'EP');
}

function drawBar(x, y, value, max, color, label) {
  fill(0, 0, 0, 100);
  noStroke();
  rect(x, y, 200, 15);
  
  fill(color);
  rect(x, y, map(value, 0, max, 0, 200), 15);
  
  fill(255);
  textSize(12);
  text(`${label}: ${ceil(value)}`, x + 5, y + 12);
}