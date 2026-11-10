import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit.js';

/**
 * 動的ネイティブブロックの登録。
 * save は null（フロントは render.php が描画する）。
 */
registerBlockType(metadata.name, {
  edit: Edit,
  save: () => null,
});
