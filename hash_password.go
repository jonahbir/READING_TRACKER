package main
import (
"fmt"
"golang.org/x/crypto/bcrypt"
)
func PasswordHash() {
password := "adminpass123"
hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
fmt.Println(string(hash))
}
