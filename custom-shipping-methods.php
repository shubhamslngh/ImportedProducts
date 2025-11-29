<?php
/**
 * Plugin Name: Custom Weight-Based Shipping (Air + Sea)
 * Description: Adds weight-based shipping methods for By Air and By Sea.
 * Version: 2.0
 * Author: Imported Products
 */

/**
 * Helper: Get total cart weight
 */
function custom_get_cart_weight($package) {
    $total_weight = 0;

    foreach ($package['contents'] as $item) {
        $qty    = $item['quantity'];
        $weight = wc_get_weight($item['data']->get_weight(), 'kg');
        $total_weight += (float) $weight * (int) $qty;
    }

    return $total_weight;
}


/**
 * -------------------------------
 * 1. AIR SHIPPING METHOD
 * -------------------------------
 */
add_action('woocommerce_shipping_init', function () {

    if (!class_exists('WC_Shipping_By_Air_Weight')) :

        class WC_Shipping_By_Air_Weight extends WC_Shipping_Method {

            public function __construct() {
                $this->id                 = 'by_air_weight';
                $this->method_title       = __('By Air (Weight Based)');
                $this->method_description = __('Air freight charges based on total cart weight.');
                $this->enabled            = "yes";
                $this->title              = "By Air";

                $this->init();
            }

            public function init() {
                $this->init_form_fields();
                $this->init_settings();
                add_action('woocommerce_update_options_shipping_' . $this->id, [$this, 'process_admin_options']);
            }

            public function init_form_fields() {
                $this->form_fields = [
                    'enabled' => [
                        'title'   => __('Enable'),
                        'type'    => 'checkbox',
                        'default' => 'yes'
                    ],
                    'rate_per_kg' => [
                        'title'       => __('Rate per KG'),
                        'type'        => 'price',
                        'description' => __('Cost per kg of air shipping (e.g., 500 = ₹500/kg)'),
                        'default'     => '500'
                    ],
                    'min_charge' => [
                        'title'       => __('Minimum Charge'),
                        'type'        => 'price',
                        'description' => __('Minimum shipping amount regardless of weight'),
                        'default'     => '2000'
                    ],
                ];
            }

            public function calculate_shipping($package = []) {
                $weight     = custom_get_cart_weight($package);
                $rate_kg    = (float) $this->get_option('rate_per_kg');
                $min_charge = (float) $this->get_option('min_charge');

                $shipping_cost = max($min_charge, $weight * $rate_kg);

                $this->add_rate([
                    'id'    => $this->id,
                    'label' => $this->title . " (" . $weight . " kg)",
                    'cost'  => $shipping_cost,
                ]);
            }
        }

    endif;
});


/**
 * -------------------------------
 * 2. SEA SHIPPING METHOD
 * -------------------------------
 */
add_action('woocommerce_shipping_init', function () {

    if (!class_exists('WC_Shipping_By_Sea_Weight')) :

        class WC_Shipping_By_Sea_Weight extends WC_Shipping_Method {

            public function __construct() {
                $this->id                 = 'by_sea_weight';
                $this->method_title       = __('By Sea (Weight Based)');
                $this->method_description = __('Sea freight charges based on total cart weight.');
                $this->enabled            = "yes";
                $this->title              = "By Sea";

                $this->init();
            }

            public function init() {
                $this->init_form_fields();
                $this->init_settings();
                add_action('woocommerce_update_options_shipping_' . $this->id, [$this, 'process_admin_options']);
            }

            public function init_form_fields() {
                $this->form_fields = [
                    'enabled' => [
                        'title'   => __('Enable'),
                        'type'    => 'checkbox',
                        'default' => 'yes'
                    ],
                    'rate_per_kg' => [
                        'title'       => __('Rate per KG'),
                        'type'        => 'price',
                        'description' => __('Cost per kg of sea shipping (e.g., 150 = ₹150/kg)'),
                        'default'     => '150'
                    ],
                    'min_charge' => [
                        'title'       => __('Minimum Charge'),
                        'type'        => 'price',
                        'description' => __('Minimum sea freight charge'),
                        'default'     => '1000'
                    ],
                ];
            }

            public function calculate_shipping($package = []) {
                $weight     = custom_get_cart_weight($package);
                $rate_kg    = (float) $this->get_option('rate_per_kg');
                $min_charge = (float) $this->get_option('min_charge');

                $shipping_cost = max($min_charge, $weight * $rate_kg);

                $this->add_rate([
                    'id'    => $this->id,
                    'label' => $this->title . " (" . $weight . " kg)",
                    'cost'  => $shipping_cost,
                ]);
            }
        }

    endif;
});


/**
 * -------------------------------
 * 3. REGISTER METHODS
 * -------------------------------
 */
add_filter('woocommerce_shipping_methods', function ($methods) {
    $methods['by_air_weight'] = 'WC_Shipping_By_Air_Weight';
    $methods['by_sea_weight'] = 'WC_Shipping_By_Sea_Weight';
    return $methods;
});
