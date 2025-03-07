export class Editor {
  constructor() {
    this.canvas = document.getElementById('editor-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 32;
    this.cameraX = 0;
    this.cameraY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.lastCameraX = 0;
    this.lastCameraY = 0;
    this.isDeleting = false;
    this.isPlacing = false;
    this.draggedBlock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.blocks = new Map(); // key: "x,y", value: type
    this.selectedType = null;
    this.spawnPoint = { x: 3, y: 3 }; // Default spawn point
    this.selectedSlot = null; // Track selected slot
    this.sceneryTypes = {
      'cloud': { width: 2, height: 1 }, 
      'hill': { width: 4, height: 2 }, 
      'bush1': { width: 2, height: 1 },
      'bush2': { width: 3, height: 1 }, 
      'pipe': { width: 2, height: 2 },
      'endpoint': { width: 2, height: 2 } // Add endpoint to sceneryTypes
    };
    this.scenery = new Map(); // key: "x,y", value: { type, width, height }
    this.lastX = 0;
    this.lastY = 0;
    this.isErasing = false; // Add new property
    this.goalPost = null; // Track goal post position
    this.mysteryContents = new Map(); // Track mushroom vs coin contents
    this.pipeConnections = new Map(); // Track pipe connections
    this.selectingPipeExit = false;
    this.selectedPipe = null;
    this.player = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      width: 28, 
      height: 28, 
    };

    this.images = {
      floor: new Image(),
      spawn: new Image(),
      brick: new Image(),
      mystery: new Image(),
      coin: new Image(),
      cloud: new Image(),
      cloudblock: new Image(), // Add new cloud block image
      hill: new Image(),
      bush1: new Image(),
      bush2: new Image(),
      empty: new Image(),
      pipe: new Image(),
      goomba: new Image(), 
      hardblock: new Image(),
      koopa: new Image(), 
      spiney: new Image(), // Add spiney image
      mushroom: new Image(),
      endpoint: new Image(), // Add endpoint image
    };
    this.images.floor.src = 'floor.png';
    this.images.spawn.src = 'Mstand.png';
    this.images.brick.src = 'brick.png';
    this.images.mystery.src = 'mario-mystery-box';
    this.images.coin.src = 'coin.png';
    this.images.cloud.src = 'cloud1bg.png';
    this.images.cloudblock.src = 'Cloud.png';
    this.images.hill.src = 'Hill1bg.png';
    this.images.bush1.src = 'bush1bg.png';
    this.images.bush2.src = 'bush2.png';
    this.images.empty.src = 'emptyblock.png';
    this.images.pipe.src = 'Pipe.png';
    this.images.goomba.src = 'Goomba.png';
    this.images.hardblock.src = 'hardblock.png';
    this.images.koopa.src = 'Koopa1.png';
    this.images.spiney.src = 'spiney1.png'; // Add spiney image
    this.images.mushroom.src = 'mushroom.png';
    this.images.endpoint.src = 'Endpoint.png';
    this.editMode = 'place'; // Default edit mode
    this.selection = null;
    this.selectionStart = null;
    this.selectedItems = [];
    this.dragSelection = false;
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'selection-box';
    this.selectionBox.style.display = 'none';
    document.getElementById('grid-container').appendChild(this.selectionBox);
    this.propertiesPanel = document.createElement('div');
    this.propertiesPanel.className = 'item-properties';
    this.propertiesPanel.style.display = 'none';
    document.getElementById('grid-container').appendChild(this.propertiesPanel);
    
    this.resize();
    this.setupEvents();
    this.loadImages();
    this.animate();
  }

  loadImages() {
    // No need to redefine this method
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 80;
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('keydown', (e) => {
      // Cycle through edit modes with left shift
      if (e.key === 'Shift' && !e.repeat) {
        const modes = ['place', 'select', 'drag', 'duplicate', 'erase'];
        const currentIndex = modes.indexOf(this.editMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.editMode = modes[nextIndex];
        
        // Update UI to reflect new mode
        document.querySelectorAll('.edit-mode').forEach(el => {
          el.classList.remove('selected');
          if (el.dataset.mode === this.editMode) {
            el.classList.add('selected');
          }
        });
        
        // Clear selection when switching to place mode
        if (this.editMode === 'place') {
          this.clearSelection();
        }
      }
      
      // Handle keyboard navigation
      const moveAmount = 16;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        this.cameraX -= moveAmount;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        this.cameraX += moveAmount;
      }
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        this.cameraY -= moveAmount;
      }
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        this.cameraY += moveAmount;
      }
      
      // Delete selected items with Delete key
      if (e.key === 'Delete' && this.selectedItems.length > 0) {
        this.deleteSelectedItems();
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Right click for camera panning
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.lastCameraX = this.cameraX;
        this.lastCameraY = this.cameraY;
        this.canvas.style.cursor = 'grab';
      } else if (e.button === 0) { // Left click
        const gridPos = this.screenToGrid(e.clientX, e.clientY);
        
        if (this.selectingPipeExit) {
          // Set the exit point for the selected pipe
          if (this.selectedPipe) {
            // Check if there's already a pipe at the selected position
            let exitPipeExists = false;
            let exitPipeKey = `${gridPos.x},${gridPos.y}`;
            
            this.scenery.forEach((info, sceneryKey) => {
              if (info.type === 'pipe' && sceneryKey === exitPipeKey) {
                exitPipeExists = true;
              }
            });
            
            // If no pipe exists at the exit location, create one
            if (!exitPipeExists) {
              // Add a new pipe at the exit location
              this.scenery.set(exitPipeKey, {
                type: 'pipe',
                width: this.sceneryTypes['pipe'].width,
                height: this.sceneryTypes['pipe'].height
              });
            }
            
            // Create bidirectional connection between entry and exit pipes
            this.pipeConnections.set(this.selectedPipe, exitPipeKey);
            this.pipeConnections.set(exitPipeKey, this.selectedPipe);
            
            this.selectingPipeExit = false;
            this.selectedPipe = null;
            this.canvas.style.cursor = 'default';
          }
          return;
        }
        
        if (this.editMode === 'place' && this.selectedType) {
          // Place mode behavior
          this.isPlacing = true;
          this.handlePlacement(e.clientX, e.clientY);
        } else if (this.editMode === 'select') {
          // Start selection box
          this.selectionStart = { 
            x: e.clientX, 
            y: e.clientY,
            gridX: gridPos.x,
            gridY: gridPos.y 
          };
          
          // Check if clicking on empty space
          const clickedOnItem = this.isPositionOccupied(gridPos.x, gridPos.y);
          
          // If clicking outside of existing selection or on empty space, clear selection
          if (!clickedOnItem || !this.isInSelection(gridPos.x, gridPos.y)) {
            this.clearSelection();
          }
          
          this.dragSelection = true;
          this.updateSelectionBox(e.clientX, e.clientY);
        } else if (this.editMode === 'drag' && this.selectedItems.length > 0) {
          // Start dragging selected items
          this.draggedItems = [...this.selectedItems];
          this.dragOffset = { 
            x: gridPos.x - this.selectedItems[0].x, 
            y: gridPos.y - this.selectedItems[0].y 
          };
        } else if (this.editMode === 'duplicate' && this.selectedItems.length > 0) {
          // Duplicate selected items
          this.duplicateSelectedItems(gridPos);
        } else if (this.editMode === 'erase') {
          // Start erasing
          this.isErasing = true;
          this.handlePlacement(e.clientX, e.clientY);
        }
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        // Camera panning
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.cameraX = this.lastCameraX - dx;
        this.cameraY = this.lastCameraY - dy;
      } else if (this.isPlacing && this.selectedType) {
        // Place mode continuous placement
        this.handlePlacement(e.clientX, e.clientY);
      } else if (this.dragSelection && this.editMode === 'select') {
        // Update selection box while dragging
        this.updateSelectionBox(e.clientX, e.clientY);
      } else if (this.draggedItems && this.draggedItems.length > 0) {
        // Update position of dragged items
        const gridPos = this.screenToGrid(e.clientX, e.clientY);
        const dx = gridPos.x - this.draggedItems[0].x - this.dragOffset.x;
        const dy = gridPos.y - this.draggedItems[0].y - this.dragOffset.y;
        
        this.draggedItems.forEach(item => {
          item.newX = item.x + dx;
          item.newY = item.y + dy;
        });
      } else if (this.isErasing) {
        this.handlePlacement(e.clientX, e.clientY);
      }
      
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
      }
      
      if (this.dragSelection) {
        this.dragSelection = false;
        
        // Finalize selection
        if (this.editMode === 'select') {
          this.finalizeSelection();
        }
      }
      
      if (this.draggedItems && this.draggedItems.length > 0) {
        // Apply the dragged positions
        this.applyDraggedPositions();
        this.draggedItems = null;
      }
      
      if (this.draggedBlock) {
        const pos = this.screenToGrid(e.clientX, e.clientY);
        if (this.draggedBlock.isBlock) {
          this.blocks.set(`${pos.x},${pos.y}`, this.draggedBlock.type);
        } else {
          this.scenery.set(`${pos.x},${pos.y}`, {
            type: this.draggedBlock.type,
            width: this.sceneryTypes[this.draggedBlock.type].width,
            height: this.sceneryTypes[this.draggedBlock.type].height
          });
        }
        this.draggedBlock = null;
      }
      
      this.isDeleting = false;
      this.isPlacing = false;
      this.isErasing = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Setup slot selection
    const slots = document.querySelectorAll('.slot:not(.edit-mode)');
    slots.forEach(slot => {
      slot.addEventListener('click', (e) => {
        // Remove selected class from all slots
        slots.forEach(s => s.classList.remove('selected'));
        
        if (slot.querySelector('img')) {
          slot.classList.add('selected');
          this.selectedType = slot.querySelector('img').dataset.type;
          
          // Switch to place mode when selecting an item
          this.editMode = 'place';
          document.querySelectorAll('.edit-mode').forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.mode === 'place') {
              el.classList.add('selected');
            }
          });
          
          // Clear any existing selection
          this.clearSelection();
        } else {
          this.selectedType = null;
        }
      });
    });
    
    // Setup edit mode selection
    document.querySelectorAll('.edit-mode').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.edit-mode').forEach(mode => {
          mode.classList.remove('selected');
        });
        el.classList.add('selected');
        this.editMode = el.dataset.mode;
        
        // Clear selection when switching to place mode
        if (this.editMode === 'place') {
          this.clearSelection();
        }
      });
    });
  }
  
  clearSelection() {
    this.selectedItems = [];
    this.selectionBox.style.display = 'none';
    this.propertiesPanel.style.display = 'none';
  }
  
  updateSelectionBox(mouseX, mouseY) {
    if (!this.selectionStart) return;
    
    const startX = Math.min(this.selectionStart.x, mouseX);
    const startY = Math.min(this.selectionStart.y, mouseY);
    const width = Math.abs(mouseX - this.selectionStart.x);
    const height = Math.abs(mouseY - this.selectionStart.y);
    
    this.selectionBox.style.display = 'block';
    this.selectionBox.style.left = startX + 'px';
    this.selectionBox.style.top = startY + 'px';
    this.selectionBox.style.width = width + 'px';
    this.selectionBox.style.height = height + 'px';
  }
  
  finalizeSelection() {
    if (!this.selectionStart) return;
    
    // Get grid coordinates of selection box
    const startGridX = this.selectionStart.gridX;
    const startGridY = this.selectionStart.gridY;
    const endGridX = this.screenToGrid(this.lastX, this.lastY).x;
    const endGridY = this.screenToGrid(this.lastX, this.lastY).y;
    
    const minX = Math.min(startGridX, endGridX);
    const maxX = Math.max(startGridX, endGridX);
    const minY = Math.min(startGridY, endGridY);
    const maxY = Math.max(startGridY, endGridY);
    
    // Find all items in the selection area
    this.selectedItems = [];
    
    // Check blocks
    this.blocks.forEach((type, key) => {
      const [x, y] = key.split(',').map(Number);
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        this.selectedItems.push({
          type: 'block',
          itemType: type,
          x: x,
          y: y,
          key: key
        });
      }
    });
    
    // Check scenery
    this.scenery.forEach((info, key) => {
      const [x, y] = key.split(',').map(Number);
      const width = this.sceneryTypes[info.type].width;
      const height = this.sceneryTypes[info.type].height;
      
      // Check if any part of the scenery is in the selection
      if (!(x + width - 1 < minX || x > maxX || y + height - 1 < minY || y > maxY)) {
        this.selectedItems.push({
          type: 'scenery',
          itemType: info.type,
          x: x,
          y: y,
          width: width,
          height: height,
          key: key
        });
      }
    });
    
    // If only one item is selected, show properties panel
    if (this.selectedItems.length === 1) {
      this.updatePropertiesPanel(this.selectedItems[0]);
    }
    
    this.selectionStart = null;
  }
  
  isPositionOccupied(x, y) {
    // Check blocks
    if (this.blocks.has(`${x},${y}`)) {
      return true;
    }
    
    // Check scenery
    for (const [key, info] of this.scenery.entries()) {
      const [sx, sy] = key.split(',').map(Number);
      const width = this.sceneryTypes[info.type].width;
      const height = this.sceneryTypes[info.type].height;
      
      if (x >= sx && x < sx + width && y >= sy && y < sy + height) {
        return true;
      }
    }
    
    return false;
  }
  
  isInSelection(x, y) {
    return this.selectedItems.some(item => {
      if (item.type === 'block') {
        return item.x === x && item.y === y;
      } else if (item.type === 'scenery') {
        return x >= item.x && x < item.x + item.width && 
               y >= item.y && y < item.y + item.height;
      }
      return false;
    });
  }
  
  deleteSelectedItems() {
    this.selectedItems.forEach(item => {
      if (item.type === 'block') {
        this.blocks.delete(item.key);
      } else if (item.type === 'scenery') {
        this.scenery.delete(item.key);
      }
    });
    
    this.clearSelection();
  }
  
  duplicateSelectedItems(targetPos) {
    const newItems = [];
    
    // Calculate offset for where to place duplicates
    const offsetX = targetPos.x - this.selectedItems[0].x;
    const offsetY = targetPos.y - this.selectedItems[0].y;
    
    this.selectedItems.forEach(item => {
      const newX = item.x + offsetX;
      const newY = item.y + offsetY;
      
      if (item.type === 'block') {
        this.blocks.set(`${newX},${newY}`, item.itemType);
        newItems.push({
          type: 'block',
          itemType: item.itemType,
          x: newX,
          y: newY,
          key: `${newX},${newY}`
        });
      } else if (item.type === 'scenery') {
        this.scenery.set(`${newX},${newY}`, {
          type: item.itemType,
          width: item.width,
          height: item.height
        });
        newItems.push({
          type: 'scenery',
          itemType: item.itemType,
          x: newX,
          y: newY,
          width: item.width,
          height: item.height,
          key: `${newX},${newY}`
        });
      }
    });
    
    // Select the newly duplicated items
    this.selectedItems = newItems;
  }
  
  applyDraggedPositions() {
    // Create new items at dragged positions
    this.draggedItems.forEach(item => {
      if (item.newX === undefined || item.newY === undefined) return;
      
      if (item.type === 'block') {
        // Remove from old position
        this.blocks.delete(item.key);
        
        // Add to new position
        this.blocks.set(`${item.newX},${item.newY}`, item.itemType);
        
        // Update the selected item
        item.x = item.newX;
        item.y = item.newY;
        item.key = `${item.newX},${item.newY}`;
      } else if (item.type === 'scenery') {
        // Remove from old position
        this.scenery.delete(item.key);
        
        // Add to new position
        this.scenery.set(`${item.newX},${item.newY}`, {
          type: item.itemType,
          width: item.width,
          height: item.height
        });
        
        // Update the selected item
        item.x = item.newX;
        item.y = item.newY;
        item.key = `${item.newX},${item.newY}`;
      }
      
      // Clean up temporary properties
      delete item.newX;
      delete item.newY;
    });
  }
  
  updatePropertiesPanel(item) {
    this.propertiesPanel.innerHTML = '';
    this.propertiesPanel.style.display = 'block';
    
    // Position the panel near the item
    const screenX = item.x * this.gridSize - this.cameraX;
    const screenY = item.y * this.gridSize - this.cameraY;
    this.propertiesPanel.style.left = (screenX + this.gridSize + 10) + 'px';
    this.propertiesPanel.style.top = screenY + 'px';
    
    // Item type specific properties
    if (item.itemType === 'mystery') {
      const label = document.createElement('label');
      label.textContent = 'Contains:';
      this.propertiesPanel.appendChild(label);
      
      const select = document.createElement('select');
      const coinOption = document.createElement('option');
      coinOption.value = 'coin';
      coinOption.textContent = 'Coin';
      coinOption.selected = !this.mysteryContents.has(item.key) || 
                            this.mysteryContents.get(item.key) !== 'mushroom';
      
      const mushroomOption = document.createElement('option');
      mushroomOption.value = 'mushroom';
      mushroomOption.textContent = 'Mushroom';
      mushroomOption.selected = this.mysteryContents.has(item.key) && 
                                this.mysteryContents.get(item.key) === 'mushroom';
      
      select.appendChild(coinOption);
      select.appendChild(mushroomOption);
      
      select.addEventListener('change', () => {
        if (select.value === 'mushroom') {
          this.mysteryContents.set(item.key, 'mushroom');
        } else {
          this.mysteryContents.delete(item.key);
        }
      });
      
      this.propertiesPanel.appendChild(select);
    }
    
    // Add pipe properties if it's a pipe
    if (item.itemType === 'pipe') {
      const makeEnterableBtn = document.createElement('button');
      makeEnterableBtn.textContent = 'Make Enterable';
      makeEnterableBtn.style.padding = '8px';
      makeEnterableBtn.style.marginTop = '10px';
      makeEnterableBtn.style.backgroundColor = this.pipeConnections.has(item.key) ? '#4CAF50' : '#ddd';
      makeEnterableBtn.style.color = this.pipeConnections.has(item.key) ? 'white' : 'black';
      makeEnterableBtn.style.border = 'none';
      makeEnterableBtn.style.borderRadius = '4px';
      makeEnterableBtn.style.cursor = 'pointer';
      
      makeEnterableBtn.addEventListener('click', () => {
        this.selectingPipeExit = true;
        this.selectedPipe = item.key;
        this.canvas.style.cursor = 'crosshair';
        this.propertiesPanel.style.display = 'none';
        
        // Show a tooltip
        alert('Click where you want the exit pipe to be.');
      });
      
      this.propertiesPanel.appendChild(makeEnterableBtn);
      
      if (this.pipeConnections.has(item.key)) {
        const removeConnectionBtn = document.createElement('button');
        removeConnectionBtn.textContent = 'Remove Connection';
        removeConnectionBtn.style.padding = '8px';
        removeConnectionBtn.style.marginTop = '10px';
        removeConnectionBtn.style.backgroundColor = '#f44336';
        removeConnectionBtn.style.color = 'white';
        removeConnectionBtn.style.border = 'none';
        removeConnectionBtn.style.borderRadius = '4px';
        removeConnectionBtn.style.cursor = 'pointer';
        
        removeConnectionBtn.addEventListener('click', () => {
          const exitKey = this.pipeConnections.get(item.key);
          if (exitKey) {
            // Remove both connections when removing a pipe
            this.pipeConnections.delete(exitKey);
          }
          this.pipeConnections.delete(item.key);
          this.propertiesPanel.style.display = 'none';
        });
        
        this.propertiesPanel.appendChild(removeConnectionBtn);
      }
    }
  }

  handlePlacement(clientX, clientY) {
    if (this.selectedType || this.editMode === 'erase') {
      const pos = this.screenToGrid(clientX, clientY);
      
      if (this.editMode === 'erase') {
        // Handle eraser tool
        const key = `${pos.x},${pos.y}`;
        
        // Try to delete block first
        if (this.blocks.has(key)) {
          this.blocks.delete(key);
          return;
        }

        // If no block was deleted, try to delete scenery
        this.scenery.forEach((info, sceneryKey) => {
          const [sx, sy] = sceneryKey.split(',').map(Number);
          const width = this.sceneryTypes[info.type].width;
          const height = this.sceneryTypes[info.type].height;
          
          if (pos.x >= sx && pos.x < sx + width && 
              pos.y >= sy && pos.y < sy + height) {
            this.scenery.delete(sceneryKey);
          }
        });
        
        // Check if erasing goal post
        if (this.goalPost && pos.x === this.goalPost.x && pos.y === this.goalPost.y) {
          this.goalPost = null;
        }
      } else if (this.selectedType === 'spawn') {
        this.blocks.forEach((type, key) => {
          if (type === 'spawn') {
            this.blocks.delete(key);
          }
        });
        this.spawnPoint = { x: pos.x, y: pos.y };
      } else if (this.selectedType === 'endpoint') {
        // Place goal post, ensuring there's only one
        if (this.goalPost) {
          // Remove existing goal post
          this.goalPost = null;
        }
        this.goalPost = { x: pos.x, y: pos.y };
      } else if (['cloud', 'hill', 'bush1', 'bush2', 'pipe'].includes(this.selectedType)) {
        // Only place scenery if no item is selected for deletion
        const sceneryInfo = this.sceneryTypes[this.selectedType];
        this.scenery.set(`${pos.x},${pos.y}`, {
          type: this.selectedType,
          width: sceneryInfo.width,
          height: sceneryInfo.height
        });
      } else if (this.selectedType === 'mystery') {
        const key = `${pos.x},${pos.y}`;
        if (this.blocks.has(key) && this.blocks.get(key) === 'mystery') {
          if (this.mysteryContents.has(key)) {
            this.mysteryContents.delete(key);
          } else {
            this.mysteryContents.set(key, 'mushroom');
          }
        } else {
          this.blocks.set(key, this.selectedType);
        }
      } else {
        this.blocks.set(`${pos.x},${pos.y}`, this.selectedType);
      }
    }
  }

  draw() {
    // Set background color
    this.ctx.fillStyle = '#6185f8';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = '#333';
    this.ctx.beginPath();
    for (let x = -this.cameraX % this.gridSize; x < this.canvas.width; x += this.gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
    }
    for (let y = -this.cameraY % this.gridSize; y < this.canvas.height; y += this.gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
    }
    this.ctx.stroke();

    // Draw scenery first (behind blocks)
    this.scenery.forEach((info, key) => {
      const [x, y] = key.split(',').map(Number);
      const screenX = x * this.gridSize - this.cameraX;
      const screenY = y * this.gridSize - this.cameraY;
      
      this.ctx.drawImage(
        this.images[info.type],
        screenX,
        screenY,
        this.gridSize * info.width,
        this.gridSize * info.height
      );
    });

    // Draw blocks
    this.blocks.forEach((type, key) => {
      const [x, y] = key.split(',').map(Number);
      const screenX = x * this.gridSize - this.cameraX;
      const screenY = y * this.gridSize - this.cameraY;
      
      if (this.images[type]) {
        this.ctx.drawImage(this.images[type], screenX, screenY, this.gridSize, this.gridSize);
      }
      if (type === 'mystery' && this.mysteryContents.has(key)) {
        // Draw mushroom overlay if mystery box contains mushroom
        this.ctx.drawImage(
          this.images.mushroom,
          screenX,
          screenY,
          this.gridSize,
          this.gridSize
        );
      }
    });

    // Draw dragged block if exists
    if (this.draggedBlock) {
      const pos = this.screenToGrid(this.lastX, this.lastY);
      const screenX = pos.x * this.gridSize - this.cameraX;
      const screenY = pos.y * this.gridSize - this.cameraY;
      
      if (this.draggedBlock.isBlock) {
        this.ctx.globalAlpha = 0.7;
        this.ctx.drawImage(this.images[this.draggedBlock.type], screenX, screenY, this.gridSize, this.gridSize);
        this.ctx.globalAlpha = 1.0;
      } else {
        const info = this.sceneryTypes[this.draggedBlock.type];
        this.ctx.globalAlpha = 0.7;
        this.ctx.drawImage(
          this.images[this.draggedBlock.type],
          screenX,
          screenY,
          this.gridSize * info.width,
          this.gridSize * info.height
        );
        this.ctx.globalAlpha = 1.0;
      }
    }

    // Draw goal post if exists
    if (this.goalPost) {
      const screenX = this.goalPost.x * this.gridSize - this.cameraX;
      const screenY = this.goalPost.y * this.gridSize - this.cameraY;
      this.ctx.drawImage(this.images.endpoint, screenX, screenY, this.gridSize * 2, this.gridSize * 2);
    }

    // Draw spawn point
    const screenX = this.spawnPoint.x * this.gridSize - this.cameraX;
    const screenY = this.spawnPoint.y * this.gridSize - this.cameraY;
    this.ctx.drawImage(this.images.spawn, screenX, screenY, this.gridSize, this.gridSize);
    
    // Draw selection highlight for selected items
    this.selectedItems.forEach(item => {
      const screenX = item.x * this.gridSize - this.cameraX;
      const screenY = item.y * this.gridSize - this.cameraY;
      
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 3]);
      
      if (item.type === 'block') {
        this.ctx.strokeRect(
          screenX, 
          screenY, 
          this.gridSize, 
          this.gridSize
        );
      } else if (item.type === 'scenery') {
        this.ctx.strokeRect(
          screenX, 
          screenY, 
          this.gridSize * item.width, 
          this.gridSize * item.height
        );
      }
      
      this.ctx.setLineDash([]);
      this.ctx.lineWidth = 1;
    });
    
    // Draw shadow of items being dragged
    if (this.draggedItems && this.draggedItems.length > 0) {
      this.ctx.globalAlpha = 0.5;
      
      this.draggedItems.forEach(item => {
        if (item.newX === undefined || item.newY === undefined) return;
        
        const screenX = item.newX * this.gridSize - this.cameraX;
        const screenY = item.newY * this.gridSize - this.cameraY;
        
        if (item.type === 'block' && this.images[item.itemType]) {
          this.ctx.drawImage(
            this.images[item.itemType], 
            screenX, 
            screenY, 
            this.gridSize, 
            this.gridSize
          );
        } else if (item.type === 'scenery' && this.images[item.itemType]) {
          this.ctx.drawImage(
            this.images[item.itemType],
            screenX,
            screenY,
            this.gridSize * item.width,
            this.gridSize * item.height
          );
        }
      });
      
      this.ctx.globalAlpha = 1.0;
    }
    
    // Draw pipe connections
    if (this.selectedItems.length === 1 && this.selectedItems[0].itemType === 'pipe') {
      const pipeKey = this.selectedItems[0].key;
      if (this.pipeConnections.has(pipeKey)) {
        const [startX, startY] = pipeKey.split(',').map(Number);
        const [endX, endY] = this.pipeConnections.get(pipeKey).split(',').map(Number);
        
        const startScreenX = startX * this.gridSize - this.cameraX + this.gridSize;
        const startScreenY = startY * this.gridSize - this.cameraY + this.gridSize;
        const endScreenX = endX * this.gridSize - this.cameraX + this.gridSize;
        const endScreenY = endY * this.gridSize - this.cameraY + this.gridSize;
        
        // Draw dotted line between connected pipes
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(startScreenX, startScreenY);
        this.ctx.lineTo(endScreenX, endScreenY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw arrow at end point
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(endScreenX, endScreenY, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // If currently selecting a pipe exit, draw a line from the pipe to the cursor
    if (this.selectingPipeExit && this.selectedPipe) {
      const [startX, startY] = this.selectedPipe.split(',').map(Number);
      const mousePos = this.screenToGrid(this.lastX, this.lastY);
      
      const startScreenX = startX * this.gridSize - this.cameraX + this.gridSize;
      const startScreenY = startY * this.gridSize - this.cameraY + this.gridSize;
      const endScreenX = mousePos.x * this.gridSize - this.cameraX + this.gridSize / 2;
      const endScreenY = mousePos.y * this.gridSize - this.cameraY + this.gridSize / 2;
      
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(startScreenX, startScreenY);
      this.ctx.lineTo(endScreenX, endScreenY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      
      // Draw highlight at cursor position
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.fillRect(
        mousePos.x * this.gridSize - this.cameraX,
        mousePos.y * this.gridSize - this.cameraY,
        this.gridSize,
        this.gridSize
      );
    }
    
    // Update cursor style based on selected tool
    if (this.editMode === 'erase') {
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  animate() {
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  saveLevel() {
    const blocks = [];
    this.blocks.forEach((type, key) => {
      if (type !== 'spawn') {
        const [x, y] = key.split(',').map(Number);
        const typeChar = type === 'floor' ? 'f' :
                        type === 'brick' ? 'b' :
                        type === 'hardblock' ? 'h' :
                        type === 'mystery' ? 'm' :
                        type === 'coin' ? 'c' :
                        type === 'goomba' ? 'g' :
                        type === 'koopa' ? 'k' :
                        type === 'spiney' ? 's' :
                        type === 'cloudblock' ? 'l' : // Add cloud block type
                        type[0];
        const contents = type === 'mystery' ? (this.mysteryContents.has(key) ? 'mushroom' : 'coin') : null;
        blocks.push([x, y, typeChar, contents]);
      }
    });

    const pipeConnections = [];
    this.pipeConnections.forEach((exitPos, entryPos) => {
      const [entryX, entryY] = entryPos.split(',').map(Number);
      const [exitX, exitY] = exitPos.split(',').map(Number);
      pipeConnections.push([entryX, entryY, exitX, exitY]);
    });

    // Include goal post if exists
    const goalPostData = this.goalPost ? [this.goalPost.x, this.goalPost.y] : null;

    return {
      b: blocks,
      s: [this.spawnPoint.x, this.spawnPoint.y],
      d: Array.from(this.scenery.keys()).map(key => {
        const [x, y] = key.split(',').map(Number);
        const info = this.scenery.get(key);
        return [x, y, info.type];
      }),
      p: pipeConnections,
      g: goalPostData,  // Add goal post to level data
    };
  }

  loadLevel(levelData) {
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
  }

  screenToGrid(x, y) {
    // Adjust for camera position and toolbar height
    const adjustedY = y - 80; // Account for toolbar height
    return {
      x: Math.floor((x + this.cameraX) / this.gridSize),
      y: Math.floor((adjustedY + this.cameraY) / this.gridSize)
    };
  }
}