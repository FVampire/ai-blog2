import { Entity, PrimaryColumn } from 'typeorm';

@Entity('post_tags')
export class PostTag {
  @PrimaryColumn({ name: 'post_id', type: 'int' })
  postId!: number;

  @PrimaryColumn({ name: 'tag_id', type: 'int' })
  tagId!: number;
}
