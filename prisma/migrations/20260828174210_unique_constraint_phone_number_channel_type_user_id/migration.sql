CREATE UNIQUE INDEX "Destination_userId_channelType_phoneNumber_key"
    ON "Destination" (
                      "userId",
                      "channelType",
        (metadata->>'phoneNumber')
        )
    WHERE
  "channelType" IN ('sms', 'whatsapp')
  AND metadata->>'phoneNumber' IS NOT NULL;