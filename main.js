import { Editor } from './editor.js';
import { Game } from './game.js';

let currentUsername = "Guest"; // Default username
let room = new WebsimSocket();

// Try to get the current user's username using websim's API
async function initializeUser() {
  try {
    const creator = await window.websim.getCreatedBy();
    if (creator && creator.username) {
      currentUsername = creator.username;
    }
  } catch (error) {
    console.error('Error getting username:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initializeUser();

  const menu = document.getElementById('menu');
  const editor = document.getElementById('editor');
  const playMenu = document.getElementById('play-menu');
  const gameContainer = document.getElementById('game-container');
  const createBtn = document.getElementById('createBtn');
  const coursesBtn = document.getElementById('coursesBtn');
  const playBtn = document.getElementById('playBtn');
  const backBtn = document.getElementById('backBtn');
  const backToMenuBtn = document.getElementById('backToMenuBtn');
  const backToMenuFromPlay = document.getElementById('backToMenuFromPlay');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const levelInput = document.getElementById('levelInput');
  const modal = document.getElementById('modal');
  const levelIdText = document.getElementById('levelIdText');
  const closeModal = document.getElementById('closeModal');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const testBtn = document.getElementById('testBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const uploadLevelBtn = document.getElementById('uploadLevelBtn');
  const pauseBackBtn = document.getElementById('pauseBackBtn');
  const changelogBtn = document.getElementById('changelogBtn');
  const changelogModal = document.getElementById('changelog-modal');
  const closeChangelogBtn = document.getElementById('closeChangelogBtn');

  let editorInstance = null;
  let gameInstance = null;
  let isTestingLevel = false;

  let currentSort = 'new';

  if (coursesBtn) {
    coursesBtn.addEventListener('click', () => {
      menu.classList.add('hidden');
      document.getElementById('courses-menu').classList.remove('hidden');
      loadCourses(currentSort);
    });
  }

  const backFromCoursesBtn = document.getElementById('backFromCoursesBtn');
  if (backFromCoursesBtn) {
    backFromCoursesBtn.addEventListener('click', () => {
      document.getElementById('courses-menu').classList.add('hidden');
      menu.classList.remove('hidden');
    });
  }

  const sortButtons = document.querySelectorAll('.sort-btn');
  if (sortButtons) {
    sortButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentSort = btn.dataset.sort;
        loadCourses(currentSort);
      });
    });
  }

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = document.getElementById('courseSearch').value;
      searchCourses(query);
    });
  }

  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      if (editorInstance) {
        const levelData = editorInstance.saveLevel();
        if (!levelData.g) {
          alert('You need to place a goal post before testing your level!');
          return;
        }
        
        // Open the upload form first
        const levelId = generateLevelId();
        document.getElementById('levelIdDisplay').textContent = levelId;
        document.getElementById('upload-modal').classList.remove('hidden');
      }
    });
  }

  const confirmUploadBtn = document.getElementById('confirmUploadBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  
  if (confirmUploadBtn) {
    confirmUploadBtn.addEventListener('click', () => {
      const name = document.getElementById('levelName').value;
      const description = document.getElementById('levelDescription').value;
      const levelId = document.getElementById('levelIdDisplay').textContent;
      
      if (!name.trim()) {
        alert('Please provide a level title');
        return;
      }
      
      if (editorInstance) {
        const levelData = editorInstance.saveLevel();
        
        // Check if level has a goal post
        if (!levelData.g) {
          alert('You need to place a goal post before uploading your level!');
          return;
        }
        
        // Validate minimum object count
        const totalObjects = levelData.b.length + levelData.d.length;
        if (totalObjects < 30) {
          alert('You need to place at least 30 objects before uploading a level.');
          return;
        }
        
        // Upload level directly instead of requiring clear check
        const levelToUpload = {
          id: levelId,
          name: name,
          description: description,
          data: levelData,
          timestamp: Date.now(),
          likes: 0
        };
        
        uploadLevel(levelToUpload);
        document.getElementById('upload-modal').classList.add('hidden');
      }
    });
  }
  
  if (cancelUploadBtn) {
    cancelUploadBtn.addEventListener('click', () => {
      document.getElementById('upload-modal').classList.add('hidden');
    });
  }

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      menu.classList.add('hidden');
      editor.classList.remove('hidden');
      editorInstance = new Editor();
    });
  }

  if (playBtn) {
    playBtn.remove();
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      editor.classList.add('hidden');
      menu.classList.remove('hidden');
      if (editorInstance) {
        editorInstance.destroy();
        editorInstance = null;
      }
    });
  }

  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
      if (isTestingLevel) {
        gameContainer.classList.add('hidden');
        editor.classList.remove('hidden');
        if (gameInstance) {
          gameInstance.destroy();
          gameInstance = null;
        }
        isTestingLevel = false;
      } else {
        gameContainer.classList.add('hidden');
        menu.classList.remove('hidden');
        if (gameInstance) {
          gameInstance.destroy();
          gameInstance = null;
        }
      }
    });
  }

  if (backToMenuFromPlay) {
    backToMenuFromPlay.addEventListener('click', () => {
      playMenu.classList.add('hidden');
      menu.classList.remove('hidden');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (editorInstance) {
        const levelData = editorInstance.saveLevel();
        const levelId = btoa(JSON.stringify(levelData))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
        levelIdText.value = levelId;
        modal.classList.remove('hidden');
      }
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      if (editorInstance) {
        const levelData = editorInstance.saveLevel();
        editor.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameInstance = new Game();
        gameInstance.isTestingMode = true;
        gameInstance.loadLevel(levelData);
        isTestingLevel = true;
      }
    });
  }

  if (loadBtn && levelInput) {
    loadBtn.addEventListener('click', () => {
      const levelId = levelInput.value.trim();
      try {
        const paddedId = levelId
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(levelId.length + (4 - (levelId.length % 4)) % 4, '=');
        const levelData = JSON.parse(atob(paddedId));
        
        playMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        gameInstance = new Game();
        gameInstance.isTestingMode = false;
        gameInstance.loadLevel(levelData);
      } catch (e) {
        alert('Invalid level ID!');
      }
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  if (levelIdText) {
    levelIdText.addEventListener('click', () => {
      levelIdText.select();
    });
  }

  if (levelInput) {
    levelInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadBtn.click();
      }
    });
  }

  async function uploadLevel(levelData) {
    try {
      await room.collection('mario_maker_levels').create({
        name: levelData.name,
        description: levelData.description,
        data: levelData.data,
        timestamp: Date.now(),
        likes: 0,
        username: currentUsername,
      });
      
      // Close upload modal after successful upload
      document.getElementById('upload-modal').classList.add('hidden');
      alert('Level uploaded successfully!');
    } catch (error) {
      console.error('Error uploading level:', error);
      alert('Failed to upload level');
    }
  }

  async function loadCourses(sort) {
    try {
      const levelsList = await room.collection('mario_maker_levels').getList();
      
      // Sort levels based on selected criteria
      let sortedLevels = [...levelsList];
      switch(sort) {
        case 'new':
          sortedLevels.sort((a, b) => b.created_at - a.created_at);
          break;
        case 'popular':
          sortedLevels.sort((a, b) => b.likes - a.likes);
          break;
        case 'hot':
          const hotWindow = 24 * 60 * 60 * 1000; // 24 hours
          const now = Date.now();
          sortedLevels = sortedLevels
            .filter(level => now - new Date(level.created_at).getTime() < hotWindow)
            .sort((a, b) => b.likes - a.likes);
          break;
      }
      
      displayCourses(sortedLevels);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  room.collection('mario_maker_levels').subscribe((levels) => {
    displayCourses(levels);
  });

  function displayCourses(courseList) {
    const container = document.querySelector('.courses-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    courseList.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      
      const preview = document.createElement('div');
      preview.className = 'course-preview';
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 120;
      previewCanvas.height = 90;
      const ctx = previewCanvas.getContext('2d');
      
      drawLevelPreview(ctx, course.data);
      preview.appendChild(previewCanvas);
      
      const userInfo = `
        <div class="course-user">
          <img src="https://images.websim.ai/avatar/${course.username}" alt="User Avatar">
          <span>@${course.username}</span>
        </div>
      `;
      
      const isOwnPost = course.username === currentUsername;
      const canDelete = isOwnPost || currentUsername === "Ai_guy";
      
      card.innerHTML = `
        <div class="course-preview">
          ${previewCanvas.outerHTML}
        </div>
        <div class="course-info">
          ${userInfo}
          <h3>${course.name}</h3>
          <div class="course-stats">
            <span>❤️ ${course.likes || 0}</span>
          </div>
        </div>
        <div class="course-actions">
          ${canDelete ? `<button class="delete-course" data-id="${course.id}">Delete</button>` : ''}
          <button class="play-course" data-id="${course.id}">Play</button>
        </div>
      `;

      // Handle play button click
      const playButton = card.querySelector('.play-course');
      if (playButton) {
        playButton.addEventListener('click', () => {
          document.getElementById('courses-menu').classList.add('hidden');
          gameContainer.classList.remove('hidden');
          
          // Clear any existing game instance
          if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
          }
          
          gameInstance = new Game();
          gameInstance.isTestingMode = false;
          window.currentCourse = course;
          gameInstance.loadLevel(course.data);
        });
      }

      // Handle delete button click for own posts or Ai_guy
      if (canDelete) {
        const deleteButton = card.querySelector('.delete-course');
        deleteButton.style.display = 'block';
        deleteButton.addEventListener('click', async (event) => {
          if (event.shiftKey || confirm('Are you sure you want to delete this course?')) {
            try {
              await room.collection('mario_maker_levels').delete(course.id);
              loadCourses(currentSort);
            } catch (error) {
              console.error('Error deleting course:', error);
              alert('Failed to delete course');
            }
          }
        });
      }
      
      container.appendChild(card);
    });
  }

  async function handleLike(courseId, like) {
    try {
      const course = await room.collection('mario_maker_levels').get(courseId);
      if (like) {
        await room.collection('mario_maker_levels').update(courseId, {
          likes: (course.likes || 0) + 1
        });
      } else {
        await room.collection('mario_maker_levels').update(courseId, {
          likes: Math.max(0, (course.likes || 0) - 1)
        });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  }

  function searchCourses(query) {
    room.collection('mario_maker_levels').getList().then(levelsList => {
      const results = levelsList.filter(course => 
        course.name.toLowerCase().includes(query.toLowerCase()) ||
        course.username.toLowerCase().includes(query.toLowerCase())
      );
      displayCourses(results);
    });
  }

  function drawLevelPreview(ctx, levelData) {
    ctx.fillStyle = '#6185f8';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const scale = 0.25;
    ctx.scale(scale, scale);
    
    levelData.b.forEach(block => {
      const x = block[0] * 32;
      const y = block[1] * 32;
      const type = block[2];
      
      switch(type) {
        case 'f':
          ctx.fillStyle = '#966c4a';
          break;
        case 'b':
          ctx.fillStyle = '#cc8866';
          break;
        case 'm':
          ctx.fillStyle = '#ffcc00';
          break;
        default:
          ctx.fillStyle = '#aaa';
      }
      
      ctx.fillRect(x, y, 32, 32);
    });
    
    if (levelData.s) {
      ctx.fillStyle = 'red';
      ctx.fillRect(levelData.s[0] * 32, levelData.s[1] * 32, 32, 32);
    }
  }

  function generateLevelId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function updatePauseMenu() {
    const pauseContent = document.querySelector('.pause-content');
    if (!pauseContent || !gameInstance || !gameInstance.pauseMenu) return;

    // Always rebuild the pause menu content
    if (window.currentCourse) {
      pauseContent.innerHTML = `
        <h2>PAUSED</h2>
        <div class="pause-buttons">
          <div class="like-buttons">
            <button id="likeBtn" class="like-btn ${window.currentCourse.userLiked ? 'selected' : ''}">❤️</button>
            <button id="dislikeBtn" class="like-btn ${window.currentCourse.userDisliked ? 'selected' : ''}">💔</button>
          </div>
          <button id="resumeBtn" class="menu-button">Resume</button>
          <button id="pauseBackBtn" class="menu-button">Back to Course World</button>
        </div>
      `;
      
      const resumeBtn = document.getElementById('resumeBtn');
      const pauseBackBtn = document.getElementById('pauseBackBtn');
      const likeBtn = document.getElementById('likeBtn');
      const dislikeBtn = document.getElementById('dislikeBtn');
      
      if (resumeBtn && gameInstance) {
        resumeBtn.addEventListener('click', () => {
          gameInstance.unpause();
        });
      }

      if (pauseBackBtn && gameInstance) {
        pauseBackBtn.addEventListener('click', () => {
          gameContainer.classList.add('hidden');
          if (gameInstance.isTestingMode) {
            editor.classList.remove('hidden');
          } else {
            menu.classList.remove('hidden');
          }
          if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
          }
        });
      }

      if (likeBtn && dislikeBtn) {
        likeBtn.addEventListener('click', () => {
          if (!window.currentCourse.userLiked) {
            handleLike(window.currentCourse.id, true);
            window.currentCourse.likes++;
            window.currentCourse.userLiked = true;
            window.currentCourse.userDisliked = false;
            likeBtn.classList.add('selected');
            dislikeBtn.classList.remove('selected');
          }
        });

        dislikeBtn.addEventListener('click', () => {
          if (!window.currentCourse.userDisliked) {
            if (window.currentCourse.userLiked) {
              window.currentCourse.likes--;
            }
            window.currentCourse.userLiked = false;
            window.currentCourse.userDisliked = true;
            likeBtn.classList.remove('selected');
            dislikeBtn.classList.add('selected');
          }
        });
      }
    } else {
      pauseContent.innerHTML = `
        <h2>PAUSED</h2>
        <div class="pause-buttons">
          <button id="resumeBtn" class="menu-button">Resume</button>
          <button id="uploadLevelBtn" class="menu-button green">Upload Level</button>
          <button id="pauseBackBtn" class="menu-button">Back to Menu</button>
        </div>
      `;
      
      const resumeBtn = document.getElementById('resumeBtn');
      const uploadLevelBtn = document.getElementById('uploadLevelBtn');
      const pauseBackBtn = document.getElementById('pauseBackBtn');
      
      if (resumeBtn && gameInstance) {
        resumeBtn.addEventListener('click', () => {
          gameInstance.unpause();
        });
      }

      if (uploadLevelBtn) {
        uploadLevelBtn.addEventListener('click', () => {
          const levelId = generateLevelId();
          document.getElementById('levelIdDisplay').textContent = levelId;
          document.getElementById('upload-modal').classList.remove('hidden');
        });
      }

      if (pauseBackBtn && gameInstance) {
        pauseBackBtn.addEventListener('click', () => {
          gameContainer.classList.add('hidden');
          if (gameInstance.isTestingMode) {
            editor.classList.remove('hidden');
          } else {
            menu.classList.remove('hidden');
          }
          if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
          }
        });
      }
    }
  }

  if (changelogBtn) {
    changelogBtn.addEventListener('click', () => {
      changelogModal.classList.remove('hidden');
    });
  }

  if (closeChangelogBtn) {
    closeChangelogBtn.addEventListener('click', () => {
      changelogModal.classList.add('hidden');
    });
  }

  if (changelogModal) {
    changelogModal.addEventListener('click', (e) => {
      if (e.target === changelogModal) {
        changelogModal.classList.add('hidden');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && gameInstance && gameInstance.pauseMenu) {
      if (gameInstance.isPaused) {
        gameInstance.unpause();
      } else {
        gameInstance.pause();
        updatePauseMenu();
      }
    }
  });
});

Game.prototype.setupCompletionScreen = function() {
  const completionContent = this.completionScreen.querySelector('.completion-content');
  
  // Dynamically update completion screen content based on mode
  if (this.isClearCheck) {
    completionContent.innerHTML = `
      <h2>Level Cleared!</h2>
      <div class="completion-buttons">
        <button id="uploadLevelBtn" class="menu-button green">Upload Level</button>
        <button id="completionBackBtn" class="menu-button">Back to Editor</button>
      </div>
    `;
  } else if (this.isTestingMode) {
    completionContent.innerHTML = `
      <h2>Level Complete!</h2>
      <div class="completion-buttons">
        <button id="completionBackBtn" class="menu-button">Back to Editor</button>
      </div>
    `;
  } else {
    completionContent.innerHTML = `
      <h2>Level Complete!</h2>
      <div class="completion-buttons">
        <div class="like-buttons">
          <button id="completionLikeBtn" class="like-btn ${window.currentCourse && window.currentCourse.userLiked ? 'selected' : ''}">❤️</button>
          <button id="completionDislikeBtn" class="like-btn ${window.currentCourse && window.currentCourse.userDisliked ? 'selected' : ''}">💔</button>
        </div>
        <button id="completionReplayBtn" class="menu-button">Replay</button>
        <button id="completionBackBtn" class="menu-button">Back to Course World</button>
      </div>
    `;
  }

  const backBtn = completionContent.querySelector('#completionBackBtn');
  const replayBtn = completionContent.querySelector('#completionReplayBtn');
  const likeBtn = completionContent.querySelector('#completionLikeBtn');
  const dislikeBtn = completionContent.querySelector('#completionDislikeBtn');
  const uploadLevelBtn = completionContent.querySelector('#uploadLevelBtn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (this.isTestingMode || this.isClearCheck) {
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('editor').classList.remove('hidden');
      } else {
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('courses-menu').classList.remove('hidden');
      }
      this.destroy();
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      this.completionScreen.classList.add('hidden');
      this.isCompleted = false;
      this.fadeAlpha = 0;
      this.showingCompletionScreen = false;
      this.resetLevel();
    });
  }

  if (uploadLevelBtn) {
    uploadLevelBtn.addEventListener('click', () => {
      if (window.pendingUpload) {
        uploadLevel(window.pendingUpload);
        window.pendingUpload = null;
      }
      this.completionScreen.classList.add('hidden');
      document.getElementById('game-container').classList.add('hidden');
      document.getElementById('editor').classList.remove('hidden');
    });
  }

  if (likeBtn && dislikeBtn && window.currentCourse) {
    likeBtn.addEventListener('click', () => {
      if (!window.currentCourse.userLiked) {
        handleLike(window.currentCourse.id, true);
        window.currentCourse.likes++;
        window.currentCourse.userLiked = true;
        window.currentCourse.userDisliked = false;
        likeBtn.classList.add('selected');
        dislikeBtn.classList.remove('selected');
      }
    });

    dislikeBtn.addEventListener('click', () => {
      if (!window.currentCourse.userDisliked) {
        if (window.currentCourse.userLiked) {
          window.currentCourse.likes--;
          handleLike(window.currentCourse.id, false);
        }
        window.currentCourse.userLiked = false;
        window.currentCourse.userDisliked = true;
        likeBtn.classList.remove('selected');
        dislikeBtn.classList.add('selected');
      }
    });
  }
};