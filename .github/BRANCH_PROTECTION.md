# Налаштування захисту гілки main

## Через веб-інтерфейс GitHub (рекомендовано)

1. Перейдіть у ваш репозиторій на GitHub
2. Відкрийте **Settings** → **Branches**
3. У розділі **Branch protection rules** натисніть **Add rule**
4. У полі **Branch name pattern** введіть: `main`
5. Увімкніть наступні опції:
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals** (мінімум 1)
     - ✅ **Dismiss stale pull request approvals when new commits are pushed**
     - ✅ **Require review from Code Owners** (якщо є CODEOWNERS файл)
   - ✅ **Require status checks to pass before merging** (опціонально)
   - ✅ **Require conversation resolution before merging** (опціонально)
   - ✅ **Require signed commits** (опціонально, для додаткової безпеки)
   - ✅ **Require linear history** (опціонально)
   - ✅ **Include administrators** - **важливо!** Включити це, щоб навіть ви не могли комітити напряму
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches** - оберіть тільки себе

6. Натисніть **Create**

## Через GitHub CLI (альтернатива)

Якщо у вас встановлений GitHub CLI:

```bash
gh api repos/nvoitovych/passportid/branches/main/protection \
  --method PUT \
  --field required_status_checks=null \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions='{"users":["nvoitovych"],"teams":[]}'
```

## Результат

Після налаштування:
- ❌ Ніхто не зможе комітити напряму в `main`
- ✅ Всі зміни тільки через Pull Request
- ✅ PR потребує вашого апруву перед мерджем
- ✅ Навіть ви не зможете обійти ці правила (якщо увімкнено "Include administrators")

## Створення CODEOWNERS (опціонально)

Якщо хочете автоматично призначати себе рев'юером, створіть `.github/CODEOWNERS`:

```
* @nvoitovych
```

