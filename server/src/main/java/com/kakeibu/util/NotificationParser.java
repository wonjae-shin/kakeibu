package com.kakeibu.util;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class NotificationParser {

    private static final List<String> CANCEL_KEYWORDS = List.of("취소", "환불", "취소승인", "결제취소");
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("([\\d,]+)원");
    private static final Pattern CARD_NAME_PATTERN = Pattern.compile("([가-힣a-zA-Z]+카드)");

    public record ParsedNotification(int amount, String merchant, String cardName, String type) {}

    public ParsedNotification parse(String text, String appName) {
        if (text == null || text.isBlank()) return null;

        boolean isCancel = CANCEL_KEYWORDS.stream().anyMatch(text::contains);
        String type = isCancel ? "income" : "expense";

        Matcher amountMatcher = AMOUNT_PATTERN.matcher(text);
        if (!amountMatcher.find()) return null;

        String amountStr = amountMatcher.group(1).replace(",", "");
        int amount;
        try {
            amount = Integer.parseInt(amountStr);
        } catch (NumberFormatException e) {
            return null;
        }
        if (amount <= 0) return null;

        int matchIndex = amountMatcher.start();
        String beforeAmount = text.substring(0, matchIndex);
        Matcher cardMatcher = CARD_NAME_PATTERN.matcher(beforeAmount);
        String cardName = cardMatcher.find() ? cardMatcher.group(1) : (appName != null && !appName.isBlank() ? appName : "카드");

        String afterAmount = text.substring(matchIndex + amountMatcher.group(0).length());
        String merchantRaw = afterAmount.replaceAll("^[\\s승인결제처리완료]+", "");
        String merchant = cleanMerchant(merchantRaw);

        return new ParsedNotification(amount, merchant, cardName, type);
    }

    private String cleanMerchant(String s) {
        if (s == null || s.isBlank()) return "";
        return s.replaceAll("잔액.*$", "")
                .replaceAll("\\d{2}/\\d{2}.*$", "")
                .replaceAll("\\d{2}:\\d{2}.*$", "")
                .replaceAll("결제$", "")
                .trim();
    }
}
