import type { LucideIcon } from "lucide-react";
import { createElement } from "react";
import {
  Baby,
  Banknote,
  BriefcaseBusiness,
  Car,
  CircleDollarSign,
  CirclePercent,
  Coffee,
  Dog,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Laptop,
  Landmark,
  Plane,
  ReceiptText,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Tag,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const categoryIconOptions: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "shopping-basket", label: "Покупки", icon: ShoppingBasket },
  { id: "utensils", label: "Еда", icon: Utensils },
  { id: "coffee", label: "Кафе", icon: Coffee },
  { id: "car", label: "Авто", icon: Car },
  { id: "home", label: "Дом", icon: Home },
  { id: "heart-pulse", label: "Здоровье", icon: HeartPulse },
  { id: "graduation-cap", label: "Учёба", icon: GraduationCap },
  { id: "gamepad", label: "Развлечения", icon: Gamepad2 },
  { id: "smartphone", label: "Связь", icon: Smartphone },
  { id: "plane", label: "Путешествия", icon: Plane },
  { id: "shirt", label: "Одежда", icon: Shirt },
  { id: "gift", label: "Подарок", icon: Gift },
  { id: "banknote", label: "Зарплата", icon: Banknote },
  { id: "laptop", label: "Подработка", icon: Laptop },
  { id: "briefcase", label: "Бизнес", icon: BriefcaseBusiness },
  { id: "shopping-bag", label: "Продажи", icon: ShoppingBag },
  { id: "percent", label: "Проценты", icon: CirclePercent },
  { id: "landmark", label: "Финансы", icon: Landmark },
  { id: "hand-coins", label: "Деньги", icon: HandCoins },
  { id: "circle-dollar", label: "Доход", icon: CircleDollarSign },
  { id: "receipt", label: "Счёт", icon: ReceiptText },
  { id: "film", label: "Кино", icon: Film },
  { id: "dog", label: "Питомцы", icon: Dog },
  { id: "baby", label: "Дети", icon: Baby },
  { id: "tag", label: "Другое", icon: Tag },
];

const iconById = new Map(categoryIconOptions.map((option) => [option.id, option.icon]));

const inferredIcons: Array<[RegExp, LucideIcon]> = [
  [/зарплат|оклад/i, Banknote],
  [/подработ|фриланс/i, Laptop],
  [/бизнес|работ/i, BriefcaseBusiness],
  [/продаж|торгов/i, ShoppingBag],
  [/процент|кэшбек|кешбэк/i, CirclePercent],
  [/продукт|магазин|супермаркет/i, ShoppingBasket],
  [/кафе|ресторан|еда/i, Utensils],
  [/кофе/i, Coffee],
  [/авто|машин|топлив|транспорт/i, Car],
  [/дом|квартир|жкх/i, Home],
  [/здоров|аптек|врач/i, HeartPulse],
  [/уч[её]б|курс|образован/i, GraduationCap],
  [/игр|развлеч|кино/i, Gamepad2],
  [/телефон|связ|подпис/i, Smartphone],
  [/путешеств|отпуск/i, Plane],
  [/одежд|обув/i, Shirt],
  [/подар/i, Gift],
  [/питом|живот/i, Dog],
  [/дет/i, Baby],
  [/счет|чек|квитанц/i, ReceiptText],
  [/долг|заем/i, HandCoins],
];

export function getCategoryIcon(name: string, icon?: string | null) {
  return iconById.get(icon ?? "") ?? inferredIcons.find(([rule]) => rule.test(name))?.[1] ?? Tag;
}

export function CategoryIcon({ name, icon, className }: { name: string; icon?: string | null; className?: string }) {
  return createElement(getCategoryIcon(name, icon), { "aria-hidden": true, className: cn("size-5", className) });
}
