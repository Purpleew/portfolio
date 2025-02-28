document.addEventListener('DOMContentLoaded', function() {
    const projectNames = document.querySelectorAll('.project-name');
    const modal = document.querySelector('.modal');
    const modalImg = document.getElementById('project-image');
    const closeButton = document.querySelector('.close-button');
    
    // Function to open modal with project image
    projectNames.forEach(project => {
        project.addEventListener('click', function() {
            const imagePath = this.getAttribute('data-image');
            modalImg.src = imagePath;
            modal.style.display = 'block';
        });
    });
    
    // Close modal when clicking the close button
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside the image
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Store the original document ready function
const originalDocReady = $(document).ready;

// Override with our combined function
$(document).ready(function() {
    // Call the original script functionality if it exists
    if (typeof originalDocReady === 'function') {
        originalDocReady.call(this);
    }
    
    // Initialize the Matter.js physics
    initMatterJs();
    
    // Modal functionality for project images
    $('.project-name').click(function() {
        const imageSrc = $(this).data('image');
        $('#project-image').attr('src', imageSrc);
        $('.modal').css('display', 'block');
    });
    
    $('.close-button').click(function() {
        $('.modal').css('display', 'none');
    });
    
    $(window).click(function(event) {
        if ($(event.target).hasClass('modal')) {
            $('.modal').css('display', 'none');
        }
    });
});

// Matter.js initialization
function initMatterJs() {
    // Module aliases
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Common = Matter.Common,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events,
          Body = Matter.Body;

    // Create engine
    const engine = Engine.create();
    
    // Get the container element
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Create renderer
    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: container.clientWidth,
            height: container.clientHeight,
            wireframes: false,
            background: 'white'
        }
    });

    // Create boundaries
    const wallThickness = 100;
    const walls = [
        // Bottom
        Bodies.rectangle(
            container.clientWidth / 2, 
            container.clientHeight + wallThickness / 2, 
            container.clientWidth, 
            wallThickness, 
            { isStatic: true, render: { fillStyle: 'white' } }
        ),
        // Left
        Bodies.rectangle(
            -wallThickness / 2, 
            container.clientHeight / 2, 
            wallThickness, 
            container.clientHeight, 
            { isStatic: true, render: { fillStyle: 'white' } }
        ),
        // Right
        Bodies.rectangle(
            container.clientWidth + wallThickness / 2, 
            container.clientHeight / 2, 
            wallThickness, 
            container.clientHeight, 
            { isStatic: true, render: { fillStyle: 'white' } }
        ),
        // Top
        Bodies.rectangle(
            container.clientWidth / 2, 
            -wallThickness / 2, 
            container.clientWidth, 
            wallThickness, 
            { isStatic: true, render: { fillStyle: 'white' } }
        )
    ];
    
    // Add walls to the world
    Composite.add(engine.world, walls);
    
    // Create balls of different sizes
    const balls = [];
    const sizes = [8, 10, 16, 20, 25, 35];
    const brandColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    const hoverColors = ['#2980b9', '#c0392b', '#27ae60', '#d35400', '#8e44ad'];
    
    // Create multiple balls with different properties
    for (let i = 0; i < 70; i++) {
        const sizeIndex = i % sizes.length;
        const radius = sizes[sizeIndex];
        const color = brandColors[sizeIndex];
        
        const ball = Bodies.circle(
            Common.random(radius, container.clientWidth - radius),
            Common.random(radius, container.clientHeight - radius),
            radius,
            {
                restitution: 0.8,
                friction: 0.005,
                density: 0.001,
                render: {
                    fillStyle: color
                },
                originalColor: color,
                hoverColor: hoverColors[sizeIndex],
                originalSize: radius
            }
        );
        
        // Give initial velocity
        const velocityX = Common.random(-1, 1);
        const velocityY = Common.random(-1, 1);
        Body.setVelocity(ball, { x: velocityX, y: velocityY });
        
        balls.push(ball);
    }
    
    // Add all balls to the world
    Composite.add(engine.world, balls);
    
    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    
    Composite.add(engine.world, mouseConstraint);
    
    // Keep the mouse in sync with rendering
    render.mouse = mouse;
    
    // Add hover effects
    Events.on(engine, 'beforeUpdate', function() {
        const mousePosition = mouse.position;
        
        balls.forEach(ball => {
            const distanceX = mousePosition.x - ball.position.x;
            const distanceY = mousePosition.y - ball.position.y;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            const hoverThreshold = 100;
            
            if (distance < hoverThreshold) {
                // Interpolate size based on distance
                const scaleFactor = 1 + (0.5 * (1 - distance / hoverThreshold));
                const targetRadius = ball.originalSize * scaleFactor;
                
                // Gradually change size for smoother effect
                const currentRadius = ball.circleRadius;
                const newRadius = currentRadius + (targetRadius - currentRadius) * 0.1;
                
                // Apply the size change
                Body.scale(ball, newRadius / currentRadius, newRadius / currentRadius);
                
                // Change color
                ball.render.fillStyle = ball.hoverColor;
            } else {
                // Gradually return to original size if not already there
                if (Math.abs(ball.circleRadius - ball.originalSize) > 0.1) {
                    const currentRadius = ball.circleRadius;
                    const newRadius = currentRadius + (ball.originalSize - currentRadius) * 0.1;
                    Body.scale(ball, newRadius / currentRadius, newRadius / currentRadius);
                }
                
                // Return to original color
                ball.render.fillStyle = ball.white;
            }
        });
    });
    
    // Mouse click adds force to nearby balls
    Events.on(mouseConstraint, 'mousedown', function(event) {
        balls.forEach(ball => {
            const distanceX = mouse.position.x - ball.position.x;
            const distanceY = mouse.position.y - ball.position.y;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            const forceRange = 100;
            
            if (distance < forceRange) {
                // Calculate force magnitude (stronger for closer balls)
                const forceMagnitude = 0.01 * (1 - distance / forceRange);
                
                // Calculate force direction (away from mouse)
                const forceX = (distanceX / distance) * -forceMagnitude;
                const forceY = (distanceY / distance) * -forceMagnitude;
                
                // Apply the force
                Body.applyForce(ball, ball.position, { x: forceX, y: forceY });
            }
        });
    });
    
    // Run the engine
    Runner.run(engine);
    
    // Run the renderer
    Render.run(render);
    
    // Set gravity to a lower value for gentler motion
    engine.world.gravity.y = 0.5;
    
    // Handle window resize
    window.addEventListener('resize', function() {
        render.options.width = container.clientWidth;
        render.options.height = container.clientHeight;
        render.canvas.width = container.clientWidth;
        render.canvas.height = container.clientHeight;
        
        // Update positions of walls
        Body.setPosition(walls[0], {x: container.clientWidth / 2, y: container.clientHeight + wallThickness/2});
        Body.setPosition(walls[5], {x: container.clientWidth + wallThickness/2, y: container.clientHeight / 2});
        
        Render.setPixelRatio(render, window.devicePixelRatio);
    });
}

// Additional custom CSS can be added here if needed
const customStyle = document.createElement('style');
customStyle.textContent = `
    #canvas-container {
        cursor: pointer;
    }
    
    .interactive-section h2 {
        font-weight: normal;
    }
`;
document.head.appendChild(customStyle);