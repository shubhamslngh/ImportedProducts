import { gql } from '@apollo/client';

export const GET_CATEGORIES = gql`
  query GetCategories($perPage: Int = 12) {
    productCategories(first: $perPage, where: { hideEmpty: true, parent: null }) {
      edges {
        node {
          databaseId
          name
          slug
          count
          image {
            altText
            sourceUrl
          }
          products(first: 1) {
            edges {
              node {
                databaseId
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProducts($category: String!) {
    products(where: { category: $category }) {
      edges {
        node {
          databaseId
          name
          type
          image {
            sourceUrl
            altText
          }
          ... on VariableProduct {
            stockStatus
          }
          ... on ProductWithPricing {
            price
            regularPrice
            salePrice
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_DETAIL = gql`
  query ProductDetails($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      __typename
      databaseId
      name
      type
      slug
      sku
      description
      shortDescription
      ... on InventoriedProduct {
        stockStatus
      }
      ... on ProductWithPricing {
        price
        regularPrice
        salePrice
      }
      image {
        altText
        sourceUrl
      }
      galleryImages {
        nodes {
          id
          altText
          sourceUrl
        }
      }
      attributes {
        nodes {
          name
          label
          options
        }
      }
      productCategories {
        edges {
          node {
            name
            slug
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_VARIATIONS = gql`
  query ProductVariations($id: ID!) {
    variableProduct(id: $id, idType: DATABASE_ID) {
      productId
      name
      variations(first: 100) {
        nodes {
          databaseId
          name
          price
          image {
            id
            sourceUrl
          }
          attributes {
            nodes {
              id
              label
              value
            }
          }
        }
      }
    }
  }
`;

export const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($productId: Int!, $quantity: Int!, $variationId: Int!) {
    addToCart(input: { productId: $productId, quantity: $quantity, variationId: $variationId }) {
      cartItem {
        key
        quantity
        product {
          node {
            databaseId
            name
          }
        }
      }
    }
  }
`;

export const GET_CART = gql`
  query GetCart {
    cart(recalculateTotals: true) {
      total
      subtotal
      shippingTotal
      isEmpty
      contents(first: 100) {
        nodes {
          key
          quantity
          subtotal
          variation {
            node {
              databaseId
              name
              price
              image {
                sourceUrl
                altText
              }
            }
          }
          product {
            node {
              databaseId
              name
              image {
                sourceUrl
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_CART_ITEMS = gql`
  mutation UpdateCartItems($items: [CartItemQuantityInput]) {
    updateItemQuantities(input: { items: $items }) {
      cart {
        total
        subtotal
        shippingTotal
      }
      items {
        key
        quantity
      }
    }
  }
`;

export const REMOVE_CART_ITEMS = gql`
  mutation RemoveCartItems($keys: [ID], $all: Boolean) {
    removeItemsFromCart(input: { keys: $keys, all: $all }) {
      cart {
        total
        subtotal
        shippingTotal
      }
      cartItems {
        key
      }
    }
  }
`;

export const CHECKOUT_MUTATION = gql`
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      order {
        databaseId
        orderNumber
        status
        total
      }
    }
  }
`;

export const GET_ACCOUNT_OVERVIEW = gql`
  query GetAccountOverview($customerId: Int!) {
    customer(customerId: $customerId) {
      databaseId
      displayName
      email
      firstName
      lastName
      billing {
        firstName
        lastName
        address1
        address2
        city
        state
        postcode
        country
        phone
      }
      shipping {
        firstName
        lastName
        address1
        address2
        city
        state
        postcode
        country
      }
      orders(first: 20) {
        nodes {
          databaseId
          orderNumber
          status
          date
          total
          subtotal
          shippingTotal
          lineItems(first: 10) {
            nodes {
              quantity
              total
              product {
                node {
                  databaseId
                  name
                  image {
                    sourceUrl
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_BILLING_DETAILS = gql`
  mutation UpdateBillingDetails($customerId: ID!, $billing: CustomerAddressInput!, $email: String!) {
    updateCustomer(input: { id: $customerId, billing: $billing, email: $email }) {
      customer {
        databaseId
        email
        billing {
          firstName
          lastName
          country
          address1
          address2
          city
          state
          postcode
          phone
        }
      }
    }
  }
`;

export const GET_RECENT_POSTS = gql`
  query GetRecentPosts {
    posts {
      nodes {
        databaseId
        title
        excerpt
        slug
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      databaseId
      title
      content
      date
      slug
      commentCount
      comments {
        nodes {
          databaseId
          date
          content
          author {
            node {
              name
            }
          }
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      author {
        node {
          name
        }
      }
    }
  }
`;
export const ADD_COMMENT = gql`
  mutation AddComment(
    $postId: Int!
    $content: String!
    $author: String
    $email: String
  ) {
    createComment(
      input: {
        commentOn: $postId
        content: $content
        author: $author
        authorEmail: $email
      }
    ) {
      success
      comment {
        databaseId
        date
        content
        author {
          node {
            name
          }
        }
      }
    }
  }
`;

export const GET_COMMENTS_BY_POST = gql`
  query GetCommentsByPost($postId: ID!, $first: Int = 50) {
    post(id: $postId, idType: DATABASE_ID) {
      databaseId
      commentCount
      comments(first: $first) {
        nodes {
          databaseId
          date
          content
          author {
            node {
              name
              email
            }
          }
        }
      }
    }
  }
`;

export const GET_COUNTRIES = gql`
  query GetCountries {
    countries {
      code
      country
    }
  }
`;
export const GET_HERO_METRICS = gql`
  query GetHeroMetrics {
    products(where: { status: PUBLISH }, first: 100) {
      nodes {
        id
      }
    }

    categories: productCategories(first: 100) {
      nodes {
        id
      }
    }

    posts(where: { status: PUBLISH }, first: 100) {
      nodes {
        id
      }
    }

    comments(first: 100) {
      nodes {
        id
      }
    }

    orders(where: { status: COMPLETED }, first: 100) {
      nodes {
        id
      }
    }
  }
`;
