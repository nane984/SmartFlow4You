from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password


# pretvara User model u JSON (i obrnuto) za read-only operacije.
# ModelSerializer → automatski generiše polja na osnovu modela.
# fields → lista polja koja će biti uključena u API.
# Koristi se npr. kada hoćeš da prikažeš podatke korisnika, bez lozinke.
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']



# serijalizer za registraciju korisnika.
# password polje: write_only=True → lozinka nije vidljiva u API odgovoru validators=[validate_password] → proverava pravila lozinke required=True → polje je obavezno
class RegisterSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    # Navodi koja polja korisnik može poslati prilikom registracije.
    # Uključuje i password, ali neće biti vraćena u JSON odgovoru (zbog write_only=True).
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'role']

    # kreira novog korisnika u bazi.
    def create(self, validated_data):
        user = User.objects.create(                         # User.objects.create(...) → kreira korisnika, ali ne postavlja još lozinku ispravno.
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'employee')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user         # vraća novokreiranog korisnika serijalizeru, koji ga može poslati kao JSON ako treba.