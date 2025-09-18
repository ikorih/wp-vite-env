<?php
/**
 * Plugin Name: My Custom Block
 * ...
 */
defined( 'ABSPATH' ) || exit;

/**
 * 常に dist/blocks/ 以下を register_block_type
 * （開発時は build-blocks.js --watch で継続出力）
 */
add_action( 'init', function() {
  $blocks = glob( __DIR__ . '/dist/blocks/*', GLOB_ONLYDIR );
  foreach ( $blocks as $block_dir ) {
    register_block_type( $block_dir );
  }
});
