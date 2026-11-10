<?php
/**
 * サンプルブロックのフロント描画（動的ネイティブ）
 *
 * @var array    $attributes ブロック属性
 * @var string   $content    InnerBlocks の内容（このブロックでは未使用）
 * @var WP_Block $block      ブロックインスタンス
 *
 * ここは通常の PHP テンプレート。テーマの Tailwind/BEM クラスがそのまま使える。
 */

$title = isset($attributes['title']) ? $attributes['title'] : '';

// 未入力なら何も出力しない
if (trim(wp_strip_all_tags($title)) === '') {
    return;
}
?>
<div <?php echo get_block_wrapper_attributes(['class' => 'c-sample']); ?>>
  <h3 class="c-sample__title"><?php echo wp_kses_post($title); ?></h3>
</div>
