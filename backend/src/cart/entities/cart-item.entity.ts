/**
 * CartItem Entity
 * Represents an item in a shopping cart
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Item } from '../../products/entities/item.entity';

@Entity('cart_items', { schema: 'public' })
@Index(['cartId', 'itemId'], { unique: true })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
  })
  quantity: number;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
