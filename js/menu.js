const canvas = document.getElementById("menuCanvas");
const ctx = canvas.getContext("2d");

// 이미지 로드
const images = {
    greenPlatform: new Image(),
    bluePlatform: new Image(),
    redPlatform: new Image(),
    brownPlatform: new Image(),
    spring: new Image(),
    monster1: new Image(),
    balloon: new Image(),
    player: new Image()
};

images.greenPlatform.src = 'images/green_platform.png';
images.bluePlatform.src = 'images/blue_platform.png';
images.redPlatform.src = 'images/red_platform.png';
images.brownPlatform.src = 'images/brown_platform.png';
images.spring.src = 'images/spring.png';
images.monster1.src = 'images/monster1.png';
images.balloon.src = 'images/balloon.png';
images.player.src = 'images/player.png';

let imagesLoaded = 0;
const totalImages = 8;

Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            init();
            gameLoop();
        }
    };
});

// 게임 상수
const GRAVITY = 0.4;
const JUMP_POWER = -13;
const PLATFORM_WIDTH = 85;
const PLATFORM_HEIGHT = 20;
const SPRING_JUMP_POWER = -24;

// 플레이어 (왼쪽에 고정)
let player = {
    x: 100,
    y: canvas.height - 150,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    jumping: false
};

// 발판
let platforms = [];
let monster = null;
let item = null;

// 버튼 상태
let playButtonHover = false;

function init() {
    // 시작 발판 (왼쪽 하단)
    platforms.push({
        x: 50,
        y: canvas.height - 80,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: 'normal',
        hasSpring: false
    });

    // 위쪽 발판들 (다양한 타입, 왼쪽 영역에만)
    const platformTypes = ['normal', 'moving', 'disappearing', 'breaking'];
    
    for (let i = 1; i < 10; i++) {
        if (i <= 1) continue; // 위 1개는 생성 금지
        
        const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
        const hasSpring = type === 'normal' && Math.random() < 0.3;
        
        platforms.push({
            x: Math.random() * 250,
            y: canvas.height - 200 - (i * 100),
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: type,
            hasSpring: hasSpring,
            springX: hasSpring ? Math.random() * (PLATFORM_WIDTH - 20) : 0,
            moveSpeed: type === 'moving' ? 2 : 0,
            moveDirection: 1
        });
    }

    // 몬스터 추가 (중간쯤)
    monster = {
        x: Math.random() * 200 + 50,
        y: canvas.height - 500,
        width: 80,
        height: 80,
        vx: 2
    };

    // 아이템이 올라갈 플랫폼 추가 (풍선 위치)
    const itemPlatformX = Math.random() * 200 + 25;
    const itemPlatformY = canvas.height - 650;
    
    platforms.push({
        x: itemPlatformX,
        y: itemPlatformY,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: 'normal',
        hasSpring: false,
        springX: 0,
        moveSpeed: 0,
        moveDirection: 1
    });

    // 아이템 추가 (플랫폼 위에 배치)
    item = {
        x: itemPlatformX + PLATFORM_WIDTH / 2 - 20,
        y: itemPlatformY - 50,
        width: 40,
        height: 50,
        type: 'balloon'
    };
}

function update() {
    // 중력
    player.vy += GRAVITY;
    player.y += player.vy;

    // 발판 충돌
    if (player.vy > 0) {
        for (let platform of platforms) {
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + 10) {
                
                // 스프링 체크
                if (platform.hasSpring) {
                    player.vy = SPRING_JUMP_POWER;
                } else {
                    player.vy = JUMP_POWER;
                }
                player.jumping = true;
            }
        }
    }

    // 움직이는 발판 업데이트
    for (let platform of platforms) {
        if (platform.type === 'moving') {
            platform.x += platform.moveSpeed * platform.moveDirection;
            // 경계 처리 개선
            if (platform.x <= 0) {
                platform.x = 0;
                platform.moveDirection = 1;
            } else if (platform.x >= 250 - platform.width) {
                platform.x = 250 - platform.width;
                platform.moveDirection = -1;
            }
        }
    }

    // 몬스터 이동
    if (monster) {
        monster.x += monster.vx;
        // 경계 처리 개선
        if (monster.x <= 0) {
            monster.x = 0;
            monster.vx = Math.abs(monster.vx);
        } else if (monster.x >= 250 - monster.width) {
            monster.x = 250 - monster.width;
            monster.vx = -Math.abs(monster.vx);
        }
    }

    // 화면 스크롤 (발판 아래로 이동)
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;

        for (let platform of platforms) {
            platform.y += diff;
        }
        
        if (monster) monster.y += diff;
        if (item) item.y += diff;
    }

    // 발판이 화면 밖으로 나가면 위에 새로 생성
    platforms = platforms.filter(p => p.y < canvas.height + 50);
    
    while (platforms.length < 10) {
        const type = ['normal', 'moving', 'disappearing', 'breaking'][Math.floor(Math.random() * 4)];
        const hasSpring = type === 'normal' && Math.random() < 0.3;
        const newPlatformY = platforms[platforms.length - 1].y - 100;
        const newPlatformX = Math.random() * 250;
        
        // 아이템이 올라갈 플랫폼 (10% 확률)
        const hasItem = Math.random() < 0.1;
        
        platforms.push({
            x: newPlatformX,
            y: newPlatformY,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: type,
            hasSpring: hasSpring,
            springX: hasSpring ? Math.random() * (PLATFORM_WIDTH - 20) : 0,
            moveSpeed: type === 'moving' ? 2 : 0,
            moveDirection: 1
        });
        
        // 플랫폼 위에 아이템 생성
        if (hasItem && !item) {
            item = {
                x: newPlatformX + PLATFORM_WIDTH / 2 - 20,
                y: newPlatformY - 50,
                width: 40,
                height: 50,
                type: 'balloon'
            };
        }
    }

    // 몬스터가 화면 밖으로 나가면 재생성
    if (monster && monster.y > canvas.height) {
        monster = {
            x: Math.random() * 200 + 50,
            y: -100,
            width: 80,
            height: 80,
            vx: 2
        };
    }

    // 아이템이 화면 밖으로 나가면 삭제
    if (item && item.y > canvas.height) {
        item = null;
    }

    // 플레이어가 떨어지면 리셋
    if (player.y > canvas.height) {
        player.y = canvas.height - 150;
        player.vy = 0;
    }
}

function draw() {
    // 배경
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 메모장 줄 그리기
    ctx.strokeStyle = '#d3d3d3';
    ctx.lineWidth = 1;
    const lineSpacing = 30;
    for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // 발판 그리기
    for (let platform of platforms) {
        let platformImage;
        if (platform.type === 'normal') {
            platformImage = images.greenPlatform;
        } else if (platform.type === 'moving') {
            platformImage = images.bluePlatform;
        } else if (platform.type === 'disappearing') {
            platformImage = images.redPlatform;
        } else if (platform.type === 'breaking') {
            platformImage = images.brownPlatform;
        }
        
        ctx.drawImage(platformImage, platform.x, platform.y, platform.width, platform.height);
        
        // 스프링 그리기
        if (platform.hasSpring) {
            const springX = platform.x + platform.springX;
            const springY = platform.y - 20;
            ctx.drawImage(images.spring, springX, springY, 20, 20);
        }
    }

    // 아이템 그리기
    if (item) {
        ctx.drawImage(images.balloon, item.x, item.y, item.width, item.height);
    }

    // 몬스터 그리기
    if (monster) {
        ctx.drawImage(images.monster1, monster.x, monster.y, monster.width, monster.height);
    }

    // 플레이어 그리기
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);

    // 오른쪽 위에 제목
    ctx.fillStyle = '#333';
    ctx.font = 'bold 50px OngleIpSeaBreeze, cursive';
    ctx.textAlign = 'right';
    ctx.fillText('HighJump.io', 580, 60);

    // 오른쪽 중앙 조작키 안내
    ctx.fillStyle = '#555';
    ctx.font = '32px OngleIpSeaBreeze, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Move : ← → ', 450, 450);
    ctx.fillText('Space : Attack', 450, 500);

    // 오른쪽 하단에 Play 버튼
    const buttonX = 400;
    const buttonY = 880;
    const buttonWidth = 160;
    const buttonHeight = 80;

    // 호버 이펙트
    if (playButtonHover) {
        ctx.fillStyle = '#f57f17';
        ctx.font = 'bold 70px OngleIpSeaBreeze, cursive';
    } else {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 62px OngleIpSeaBreeze, cursive';
    }

    ctx.textAlign = 'center';
    ctx.fillText('Play', 480, 930);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 마우스 이동 이벤트
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const buttonX = 400;
    const buttonY = 880;
    const buttonWidth = 160;
    const buttonHeight = 80;

    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        playButtonHover = true;
        canvas.style.cursor = 'pointer';
    } else {
        playButtonHover = false;
        canvas.style.cursor = 'default';
    }
});

// 클릭 이벤트
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const buttonX = 400;
    const buttonY = 880;
    const buttonWidth = 160;
    const buttonHeight = 80;

    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        window.location.href = 'game.html';
    }
});
