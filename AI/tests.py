from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from shop.models import Catergory, Product

from .service import find_products, products_payload


class ProductRecommendationTests(TestCase):
    def setUp(self):
        self.category = Catergory.objects.create(
            name="Đồ trang trí",
            slug="do-trang-tri",
        )
        self.decor_lamp = self.create_product(
            "Đèn decor bàn học",
            150000,
            "Đèn LED trang trí phòng trọ",
        )
        self.cheap_lamp = self.create_product(
            "Đèn LED mini decor",
            75000,
            "Đèn trang trí bàn học",
        )
        self.keyboard = self.create_product(
            "Bàn phím cơ gaming",
            450000,
            "Bàn phím máy tính",
        )

    def create_product(self, name, price, detail, **extra):
        product = Product.objects.create(
            name=name,
            price=price,
            detail=detail,
            **extra,
        )
        product.catergory.add(self.category)
        return product

    def test_search_ranks_matching_category_without_unrelated_products(self):
        products, show_products = find_products("Đồ decor bàn học phòng trọ")

        self.assertTrue(show_products)
        self.assertEqual({product.id for product in products}, {
            self.decor_lamp.id,
            self.cheap_lamp.id,
        })

    def test_budget_filters_by_current_sale_price(self):
        self.decor_lamp.discount_percent = 50
        self.decor_lamp.save()

        products, show_products = find_products("Đèn decor dưới 100k")

        self.assertTrue(show_products)
        self.assertEqual([product.id for product in products], [self.decor_lamp.id, self.cheap_lamp.id])

    def test_greeting_does_not_return_random_products(self):
        products, show_products = find_products("Xin chào")

        self.assertFalse(show_products)
        self.assertEqual(products, [])

    def test_follow_up_reuses_previous_product_request(self):
        products, show_products = find_products(
            "Cái nào rẻ nhất?",
            [{"role": "user", "content": "Tìm đèn decor bàn học"}],
        )

        self.assertTrue(show_products)
        self.assertEqual(products[0].id, self.cheap_lamp.id)

    def test_product_payload_uses_real_sale_data(self):
        self.decor_lamp.discount_percent = 20
        self.decor_lamp.save()

        payload = products_payload([self.decor_lamp])[0]

        self.assertEqual(payload["sale_price"], 120000)
        self.assertEqual(payload["discount_percent"], 20)

    @patch("AI.views.service.ask_ai", return_value="Mình tìm thấy đèn phù hợp.")
    def test_chat_endpoint_returns_ranked_products(self, ask_ai):
        response = self.client.post(
            reverse("chat_ai"),
            data='{"message":"Đèn decor dưới 100k","history":[]}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reply"], "Mình tìm thấy đèn phù hợp.")
        self.assertEqual(len(response.json()["products"]), 1)
        ask_ai.assert_called_once()

    def test_chat_endpoint_rejects_malformed_json(self):
        response = self.client.post(
            reverse("chat_ai"),
            data="{",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
