import { INVENTORY_SIZE, HOTBAR_SIZE } from '../utils/Constants.js';

export class Item {
  constructor(id, name, type, data = {}) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.data = data;
    this.durability = data.durability || null;
    this.maxDurability = data.maxDurability || null;
  }
  
  clone() {
    return new Item(this.id, this.name, this.type, { ...this.data });
  }
  
  damage(amount = 1) {
    if (this.durability !== null) {
      this.durability -= amount;
      return this.durability <= 0;
    }
    return false;
  }
  
  isTool() {
    return this.type === 'tool';
  }
  
  isBlock() {
    return this.type === 'block';
  }
  
  isFood() {
    return this.type === 'food';
  }
}

export class Inventory {
  constructor(size = INVENTORY_SIZE) {
    this.size = size;
    this.slots = new Array(size).fill(null).map(() => ({ item: null, count: 0 }));
  }
  
  getSlot(index) {
    if (index < 0 || index >= this.size) return null;
    return this.slots[index];
  }
  
  setSlot(index, item, count) {
    if (index < 0 || index >= this.size) return false;
    
    if (item === null || count === 0) {
      this.slots[index] = { item: null, count: 0 };
    } else {
      this.slots[index] = { item: item.clone(), count };
    }
    return true;
  }
  
  addItem(item, count = 1) {
    if (!item) return 0;
    
    let remaining = count;
    
    for (let i = 0; i < this.size && remaining > 0; i++) {
      const slot = this.slots[i];
      
      if (slot.item && slot.item.id === item.id) {
        const maxStack = this.getMaxStackSize(item);
        const canAdd = maxStack - slot.count;
        
        if (canAdd > 0) {
          const toAdd = Math.min(canAdd, remaining);
          slot.count += toAdd;
          remaining -= toAdd;
        }
      }
    }
    
    for (let i = 0; i < this.size && remaining > 0; i++) {
      const slot = this.slots[i];
      
      if (slot.item === null) {
        const maxStack = this.getMaxStackSize(item);
        const toAdd = Math.min(maxStack, remaining);
        this.setSlot(i, item, toAdd);
        remaining -= toAdd;
      }
    }
    
    return remaining;
  }
  
  removeItem(index, count = 1) {
    if (index < 0 || index >= this.size) return 0;
    
    const slot = this.slots[index];
    if (!slot.item) return 0;
    
    const toRemove = Math.min(slot.count, count);
    slot.count -= toRemove;
    
    if (slot.count <= 0) {
      slot.item = null;
      slot.count = 0;
    }
    
    return toRemove;
  }
  
  hasItem(itemId, count = 1) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.item && slot.item.id === itemId) {
        total += slot.count;
        if (total >= count) return true;
      }
    }
    return total >= count;
  }
  
  getItemCount(itemId) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.item && slot.item.id === itemId) {
        total += slot.count;
      }
    }
    return total;
  }
  
  removeItemById(itemId, count = 1) {
    let remaining = count;
    
    for (let i = 0; i < this.size && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot.item && slot.item.id === itemId) {
        const toRemove = Math.min(slot.count, remaining);
        slot.count -= toRemove;
        remaining -= toRemove;
        
        if (slot.count <= 0) {
          slot.item = null;
          slot.count = 0;
        }
      }
    }
    
    return count - remaining;
  }
  
  getMaxStackSize(item) {
    if (item.isTool()) return 1;
    if (item.isFood()) return 64;
    return 64;
  }
  
  clear() {
    for (let i = 0; i < this.size; i++) {
      this.slots[i] = { item: null, count: 0 };
    }
  }
  
  swapSlots(index1, index2) {
    if (index1 < 0 || index1 >= this.size || index2 < 0 || index2 >= this.size) {
      return false;
    }
    
    const temp = { ...this.slots[index1] };
    this.slots[index1] = { ...this.slots[index2] };
    this.slots[index2] = temp;
    
    return true;
  }
  
  isEmpty() {
    for (const slot of this.slots) {
      if (slot.item) return false;
    }
    return true;
  }
}
