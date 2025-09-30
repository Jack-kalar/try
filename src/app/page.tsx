'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeGame() {
  // 游戏设置
  const gridSize = 20;
  const initialSpeed = 150; // 毫秒
  
  // 游戏状态
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(initialSpeed);
  
  // 使用 ref 来保存最新状态，避免闭包问题
  const directionRef = useRef(direction);
  const gameOverRef = useRef(gameOver);
  const isPausedRef = useRef(isPaused);
  
  // 更新 ref 值
  useEffect(() => {
    directionRef.current = direction;
    gameOverRef.current = gameOver;
    isPausedRef.current = isPaused;
  }, [direction, gameOver, isPaused]);

  // 生成食物位置
  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    
    // 确保食物不在蛇身上
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) {
      return generateFood();
    }
    
    return newFood;
  }, [snake, gridSize]);

  // 初始化食物
  useEffect(() => {
    setFood(generateFood());
  }, [generateFood]);

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') {
            setDirection('UP');
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') {
            setDirection('DOWN');
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') {
            setDirection('LEFT');
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') {
            setDirection('RIGHT');
          }
          break;
        case ' ':
          // 空格键暂停/继续
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 游戏主循环
  useEffect(() => {
    if (isPausedRef.current || gameOverRef.current) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        
        // 根据方向移动头部
        switch (directionRef.current) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // 检查是否撞墙
        if (
          head.x < 0 || 
          head.x >= gridSize || 
          head.y < 0 || 
          head.y >= gridSize
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // 检查是否撞到自己
        if (prevSnake.some((segment, index) => 
          index > 0 && segment.x === head.x && segment.y === head.y
        )) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
          setFood(generateFood());
          setScore(prev => prev + 10);
          
          // 增加速度（但不超过一定限制）
          if (speed > 50) {
            setSpeed(prev => prev - 2);
          }
        } else {
          // 没吃到食物则移除尾部
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [food, generateFood, speed]);

  // 重置游戏
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    setSpeed(initialSpeed);
  };

  // 控制按钮处理函数
  const handleDirectionChange = (newDirection: Direction) => {
    if (gameOver) return;
    
    // 防止反向移动
    if (
      (newDirection === 'UP' && direction !== 'DOWN') ||
      (newDirection === 'DOWN' && direction !== 'UP') ||
      (newDirection === 'LEFT' && direction !== 'RIGHT') ||
      (newDirection === 'RIGHT' && direction !== 'LEFT')
    ) {
      setDirection(newDirection);
    }
  };

  // 渲染游戏网格
  const renderGrid = () => {
    const grid = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isSnakeHead = snake[0].x === x && snake[0].y === y;
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        
        let cellClass = 'cell';
        
        if (isSnakeHead) {
          cellClass += ' snake-head';
        } else if (isSnakeBody) {
          cellClass += ' snake';
        } else if (isFood) {
          cellClass += ' food';
        }
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
          />
        );
      }
    }
    
    return grid;
  };

  // 处理触摸滑动控制
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current || gameOver) {
      return;
    }

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;

    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // 确定主要滑动方向
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // 水平滑动
      if (diffX > 0 && directionRef.current !== 'RIGHT') {
        // 向左滑动
        setDirection('LEFT');
      } else if (diffX < 0 && directionRef.current !== 'LEFT') {
        // 向右滑动
        setDirection('RIGHT');
      }
    } else {
      // 垂直滑动
      if (diffY > 0 && directionRef.current !== 'DOWN') {
        // 向上滑动
        setDirection('UP');
      } else if (diffY < 0 && directionRef.current !== 'UP') {
        // 向下滑动
        setDirection('DOWN');
      }
    }

    // 重置触摸坐标
    touchStartX.current = touchEndX;
    touchStartY.current = touchEndY;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Snake Game</h1>
        <div className="game-score">Score: {score}</div>
      </div>
      
      <div 
        className="game-board"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {renderGrid()}
        {gameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <button 
              className="action-btn btn-restart"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      
      <div className="game-controls">
        <div className="directional-controls">
          <button 
            className="control-btn control-up"
            onClick={() => handleDirectionChange('UP')}
            aria-label="Move Up"
          >
            ↑
          </button>
          <button 
            className="control-btn control-left"
            onClick={() => handleDirectionChange('LEFT')}
            aria-label="Move Left"
          >
            ←
          </button>
          <div className="control-btn control-center" aria-hidden="true"></div>
          <button 
            className="control-btn control-right"
            onClick={() => handleDirectionChange('RIGHT')}
            aria-label="Move Right"
          >
            →
          </button>
          <button 
            className="control-btn control-down"
            onClick={() => handleDirectionChange('DOWN')}
            aria-label="Move Down"
          >
            ↓
          </button>
        </div>
        
        <div className="action-buttons">
          <button
            className={`action-btn ${isPaused ? 'btn-start' : 'btn-pause'}`}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Start' : 'Pause'}
          </button>
          <button
            className="action-btn btn-restart"
            onClick={resetGame}
          >
            Restart
          </button>
        </div>
      </div>
      
      <div className="instructions">
        <p>Use <strong>WASD</strong> or <strong>Arrow Keys</strong> to control the snake. On mobile, you can swipe in the direction you want to go. Press <strong>Space</strong> to pause/resume.</p>
      </div>
    </div>
  );
}