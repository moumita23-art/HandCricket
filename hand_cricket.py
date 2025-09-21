import random

print("🎮 Welcome to Hand Cricket!")
score = 0

while True:
    player = int(input("Enter your run (1-6): "))
    computer = random.randint(1, 6)
    print(f"Computer chose: {computer}")

    if player == computer:
        print("❌ OUT!")
        break
    else:
        score += player
        print(f"✅ You scored {player}. Total = {score}")

print(f"🏏 Final Score: {score}")