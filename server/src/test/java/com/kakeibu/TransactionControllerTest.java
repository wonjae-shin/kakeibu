package com.kakeibu;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kakeibu.entity.Account;
import com.kakeibu.entity.Category;
import com.kakeibu.entity.User;
import com.kakeibu.repository.AccountRepository;
import com.kakeibu.repository.CategoryRepository;
import com.kakeibu.repository.UserRepository;
import com.kakeibu.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TransactionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired AccountRepository accountRepository;
    @Autowired JwtUtil jwtUtil;

    private String accessToken;
    private String userId;
    private String categoryId;
    private String accountId;

    @BeforeEach
    void setUp() {
        User user = new User();
        userId = UUID.randomUUID().toString();
        user.setId(userId);
        user.setEmail("tx@example.com");
        user.setAnonymous(false);
        userRepository.save(user);

        Category cat = new Category();
        categoryId = UUID.randomUUID().toString();
        cat.setId(categoryId);
        cat.setName("식비");
        cat.setType("expense");
        cat.setIcon("🍔");
        cat.setColor("#ff0000");
        cat.setDefault(true);
        categoryRepository.save(cat);

        Account acc = new Account();
        accountId = UUID.randomUUID().toString();
        acc.setId(accountId);
        acc.setName("신한카드");
        acc.setType("card");
        acc.setBalance(0);
        acc.setUserId(userId);
        accountRepository.save(acc);

        accessToken = jwtUtil.generateAccessToken(userId, false);
    }

    @Test
    void createAndGetTransaction() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "expense",
                "amount", 15000,
                "date", "2026-05-01",
                "categoryId", categoryId,
                "accountId", accountId
        ));

        String response = mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(15000))
                .andReturn().getResponse().getContentAsString();

        String txId = (String) ((Map<?, ?>) objectMapper.readValue(response, Map.class).get("data")).get("id");

        mockMvc.perform(get("/api/transactions")
                .header("Authorization", "Bearer " + accessToken)
                .param("month", "2026-05"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(txId));
    }

    @Test
    void createTransaction_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("type", "expense"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getTransactions_withoutToken_returns403() throws Exception {
        mockMvc.perform(get("/api/transactions"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteTransaction() throws Exception {
        // create first
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "income", "amount", 100000, "date", "2026-05-01",
                "categoryId", categoryId, "accountId", accountId
        ));
        String response = mockMvc.perform(post("/api/transactions")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();

        String txId = (String) ((Map<?, ?>) objectMapper.readValue(response, Map.class).get("data")).get("id");

        mockMvc.perform(delete("/api/transactions/" + txId)
                .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/transactions/" + txId)
                .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound());
    }
}
